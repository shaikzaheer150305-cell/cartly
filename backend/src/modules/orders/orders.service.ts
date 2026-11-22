import { randomInt } from 'node:crypto'
import { Prisma } from '@prisma/client'
import type { OrderStatus } from '@prisma/client'
import { z } from 'zod'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import { calculateCartTotals } from '../../lib/pricing.js'
import { addressSchema, checkoutSchema, listOrdersQuerySchema, statusBodySchema } from './order.schemas.js'

type AddressInput = z.infer<typeof addressSchema>
type CheckoutInput = z.infer<typeof checkoutSchema>
type ListQuery = z.infer<typeof listOrdersQuerySchema>
type StatusInput = z.infer<typeof statusBodySchema>

const orderInclude = {
  user: { select: { name: true, email: true } },
  items: { include: { product: true } },
  events: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OrderInclude

type OrderRecord = Prisma.OrderGetPayload<{ include: typeof orderInclude }>

export interface AddressDto {
  fullName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface OrderItemDto {
  productId: string
  name: string
  slug: string
  image: string
  unitPriceCents: number
  quantity: number
  lineTotalCents: number
  available: boolean
}

export interface OrderEventDto {
  id: string
  status: OrderStatus
  actorType: 'SYSTEM' | 'CUSTOMER' | 'ADMIN'
  timestamp: string
  note: string
}

export interface OrderDto {
  id: string
  orderNumber: string
  createdAt: string
  status: OrderStatus
  customer: { name: string; email: string }
  items: OrderItemDto[]
  address: AddressDto
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  events: OrderEventDto[]
}

export interface PageResult<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

function imagesFrom(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

function addressFrom(value: Prisma.JsonValue): AddressDto {
  const empty: AddressDto = {
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return empty
  const record = value as Record<string, unknown>
  return {
    fullName: String(record.fullName ?? ''),
    phone: String(record.phone ?? ''),
    line1: String(record.line1 ?? ''),
    line2: String(record.line2 ?? ''),
    city: String(record.city ?? ''),
    state: String(record.state ?? ''),
    postalCode: String(record.postalCode ?? ''),
    country: String(record.country ?? ''),
  }
}

function toOrderDto(order: OrderRecord): OrderDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    customer: { name: order.user.name, email: order.user.email },
    items: order.items.map((item) => ({
      productId: item.productId ?? item.id,
      name: item.productName,
      slug: item.product?.slug ?? '',
      image: imagesFrom(item.product?.imageUrls ?? null)[0] ?? '',
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
      available: Boolean(item.product && item.product.isActive && !item.product.deletedAt && item.product.stock > 0),
    })),
    address: addressFrom(order.shippingAddress),
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    events: order.events.map((event) => ({
      id: event.id,
      status: event.toStatus,
      actorType: event.actorType,
      timestamp: event.createdAt.toISOString(),
      note: event.note ?? '',
    })),
  }
}

function orderNumber(): string {
  return `CRT-${new Date().getUTCFullYear()}-${Date.now().toString(36).toUpperCase()}-${randomInt(1000, 9999)}`
}

async function lockProducts(
  transaction: Prisma.TransactionClient,
  productIds: string[],
): Promise<void> {
  if (productIds.length === 0) return
  await transaction.$queryRaw(Prisma.sql`SELECT "id" FROM "Product" WHERE "id" IN (${Prisma.join(productIds)}) FOR UPDATE`)
}

async function loadOrder(id: string): Promise<OrderDto> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id }, include: orderInclude })
  return toOrderDto(order)
}

async function createOrder(userId: string, input: CheckoutInput): Promise<OrderDto> {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.order.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
      include: orderInclude,
    })
    if (existing) return toOrderDto(existing)

    const cart = await transaction.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    })
    if (!cart || cart.items.length === 0) {
      throw new HttpError(400, 'EMPTY_CART', 'Your cart is empty.')
    }

    await lockProducts(transaction, cart.items.map((item) => item.productId))
    const items = await transaction.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    })

    for (const item of items) {
      if (!item.product || !item.product.isActive || item.product.deletedAt) {
        throw new HttpError(409, 'PRODUCT_UNAVAILABLE', 'An item in your cart is no longer available.')
      }
      if (item.product.stock < item.quantity) {
        throw new HttpError(409, 'OUT_OF_STOCK', `Only ${item.product.stock} available for ${item.product.name}.`, {
          productId: item.productId,
          stock: item.product.stock,
        })
      }
    }

    const totals = calculateCartTotals(
      items.map((item) => ({ unitPriceCents: item.product.priceCents, quantity: item.quantity })),
    )
    const created = await transaction.order.create({
      data: {
        orderNumber: orderNumber(),
        userId,
        status: 'PENDING_PAYMENT',
        shippingAddress: input.address,
        subtotalCents: totals.subtotalCents,
        shippingCents: totals.shippingCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        currency: 'INR',
        idempotencyKey: input.idempotencyKey,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            unitPriceCents: item.product.priceCents,
            quantity: item.quantity,
            lineTotalCents: item.product.priceCents * item.quantity,
          })),
        },
      },
    })

    await transaction.orderEvent.create({
      data: {
        orderId: created.id,
        fromStatus: null,
        toStatus: 'PENDING_PAYMENT',
        actorType: 'SYSTEM',
        note: 'Order created.',
      },
    })
    await transaction.orderEvent.create({
      data: {
        orderId: created.id,
        fromStatus: 'PENDING_PAYMENT',
        toStatus: 'PAID',
        actorType: 'SYSTEM',
        note: 'Payment simulated and captured.',
      },
    })
    await transaction.order.update({ where: { id: created.id }, data: { status: 'PAID' } })

    for (const item of items) {
      const updated = await transaction.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      })
      if (updated.count !== 1) {
        throw new HttpError(409, 'OUT_OF_STOCK', 'Stock changed during checkout. Please review your cart.', {
          productId: item.productId,
        })
      }
    }

    await transaction.cartItem.deleteMany({ where: { cartId: cart.id } })
    const order = await transaction.order.findUniqueOrThrow({ where: { id: created.id }, include: orderInclude })
    return toOrderDto(order)
  }, { timeout: 10000 })
}

export async function placeOrder(userId: string, input: CheckoutInput): Promise<OrderDto> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await createOrder(userId, input)
    } catch (error) {
      const existing = await prisma.order.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
        include: orderInclude,
      })
      if (existing) return toOrderDto(existing)

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : []
        if (target.includes('orderNumber') && attempt < 2) continue
        throw new HttpError(409, 'CONFLICT', 'The order could not be created. Please try again.')
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        if (attempt < 2) continue
        throw new HttpError(409, 'CONFLICT', 'Stock changed during checkout. Please try again.')
      }
      throw error
    }
  }
  throw new HttpError(409, 'CONFLICT', 'The order could not be created. Please try again.')
}

function statusWhere(status?: OrderStatus): Prisma.OrderWhereInput {
  if (status === 'PENDING_PAYMENT') return { id: '' }
  if (status) return { status }
  return {}
}

export async function listOrders(userId: string, query: ListQuery): Promise<PageResult<OrderDto>> {
  const page = query.page ?? 1
  const limit = query.limit ?? 10
  const where: Prisma.OrderWhereInput = { userId, ...statusWhere(query.status) }
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { placedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])
  return {
    items: orders.map(toOrderDto),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export async function listAdminOrders(query: ListQuery): Promise<PageResult<OrderDto>> {
  const page = query.page ?? 1
  const limit = query.limit ?? 10
  const where: Prisma.OrderWhereInput = statusWhere(query.status)
  if (query.customer) {
    where.user = {
      OR: [
        { name: { contains: query.customer, mode: 'insensitive' } },
        { email: { contains: query.customer, mode: 'insensitive' } },
      ],
    }
  }
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { placedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])
  return {
    items: orders.map(toOrderDto),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export async function getOwnOrder(userId: string, id: string): Promise<OrderDto> {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude })
  if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order not found.')
  return toOrderDto(order)
}

export async function getAdminOrder(id: string): Promise<OrderDto> {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude })
  if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order not found.')
  return toOrderDto(order)
}

async function restoreStock(transaction: Prisma.TransactionClient, items: Array<{ productId: string | null; quantity: number }>): Promise<void> {
  const productIds = items.flatMap((item) => item.productId ? [item.productId] : [])
  await lockProducts(transaction, productIds)
  for (const item of items) {
    if (!item.productId) continue
    await transaction.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    })
  }
}

export async function cancelOwnOrder(userId: string, id: string): Promise<OrderDto> {
  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findFirst({ where: { id, userId }, include: orderInclude })
    if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order not found.')
    if (order.status !== 'PAID') {
      throw new HttpError(409, 'INVALID_TRANSITION', 'Only confirmed orders can be cancelled.', {
        allowed: transitions[order.status],
      })
    }

    await restoreStock(transaction, order.items)
    await transaction.order.update({ where: { id }, data: { status: 'CANCELLED' } })
    await transaction.orderEvent.create({
      data: {
        orderId: id,
        fromStatus: 'PAID',
        toStatus: 'CANCELLED',
        actorType: 'CUSTOMER',
        actorId: userId,
        note: 'Order cancelled by customer.',
      },
    })
    const updated = await transaction.order.findUniqueOrThrow({ where: { id }, include: orderInclude })
    return toOrderDto(updated)
  })
}

export async function updateOrderStatus(
  id: string,
  statusInput: StatusInput,
  adminId: string,
): Promise<OrderDto> {
  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({ where: { id }, include: orderInclude })
    if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order not found.')

    const allowed = transitions[order.status]
    if (!allowed.includes(statusInput.status)) {
      throw new HttpError(409, 'INVALID_TRANSITION', 'That status change is not allowed.', { allowed })
    }

    if (statusInput.status === 'CANCELLED') {
      await restoreStock(transaction, order.items)
    }

    await transaction.order.update({ where: { id }, data: { status: statusInput.status } })
    await transaction.orderEvent.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: statusInput.status,
        actorType: 'ADMIN',
        actorId: adminId,
        note: `Status changed to ${statusInput.status}.`,
      },
    })
    const updated = await transaction.order.findUniqueOrThrow({ where: { id }, include: orderInclude })
    return toOrderDto(updated)
  })
}

export { checkoutSchema, listOrdersQuerySchema, statusBodySchema }
