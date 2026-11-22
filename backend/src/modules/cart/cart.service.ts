import { Prisma } from '@prisma/client'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import { calculateCartTotals, pricingConfig } from '../../lib/pricing.js'

type ProductRecord = NonNullable<Awaited<ReturnType<typeof prisma.product.findUnique>>>
type CartItemRecord = Prisma.CartItemGetPayload<{ include: { product: true } }>

export interface CartItemDto {
  productId: string
  name: string
  slug: string
  image: string
  unitPriceCents: number
  quantity: number
  maxQuantity: number
  available: boolean
}

export interface CartDto {
  items: CartItemDto[]
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  freeShippingThresholdCents: number | null
}

function imagesFrom(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

function toCartItemDto(record: CartItemRecord): CartItemDto {
  return {
    productId: record.productId,
    name: record.product.name,
    slug: record.product.slug,
    image: imagesFrom(record.product.imageUrls)[0] ?? '',
    unitPriceCents: record.product.priceCents,
    quantity: record.quantity,
    maxQuantity: Math.min(record.product.stock, 99),
    available:
      record.product.isActive &&
      record.product.deletedAt === null &&
      record.product.stock >= record.quantity &&
      record.quantity <= 99,
  }
}

function assertPurchasable(product: ProductRecord, requestedQuantity: number, existingQuantity = 0): number {
  if (!product.isActive || product.deletedAt) {
    throw new HttpError(409, 'PRODUCT_UNAVAILABLE', 'This product is not available.')
  }
  if (product.stock < 1) {
    throw new HttpError(409, 'OUT_OF_STOCK', 'This product is out of stock.', { stock: 0 })
  }

  const nextQuantity = existingQuantity + requestedQuantity
  if (nextQuantity > 99) {
    throw new HttpError(409, 'QUANTITY_LIMIT', 'Cart quantity cannot exceed 99.', { maxQuantity: 99 })
  }
  if (nextQuantity > product.stock) {
    throw new HttpError(409, 'OUT_OF_STOCK', `Only ${product.stock} available.`, { stock: product.stock })
  }
  return nextQuantity
}

async function ensureCart(userId: string) {
  const existing = await prisma.cart.findUnique({ where: { userId } })
  if (existing) return existing

  try {
    return await prisma.cart.create({ data: { userId } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const created = await prisma.cart.findUnique({ where: { userId } })
      if (created) return created
    }
    throw error
  }
}

async function loadCart(userId: string): Promise<CartDto> {
  const cart = await ensureCart(userId)
  const records = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  })
  const items = records.map(toCartItemDto)
  return {
    items,
    ...calculateCartTotals(items),
    freeShippingThresholdCents: pricingConfig().freeShippingThresholdCents,
  }
}

export async function getCart(userId: string): Promise<CartDto> {
  return loadCart(userId)
}

export async function addCartItem(userId: string, productId: string, quantity: number): Promise<CartDto> {
  const cart = await ensureCart(userId)
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
    select: { quantity: true },
  })
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new HttpError(404, 'NOT_FOUND', 'Product not found.')

  assertPurchasable(product, quantity, existing?.quantity ?? 0)
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity },
    update: { quantity: (existing?.quantity ?? 0) + quantity },
  })
  return loadCart(userId)
}

export async function updateCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number,
): Promise<CartDto> {
  const cart = await ensureCart(userId)
  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
    select: { id: true },
  })
  if (!item) throw new HttpError(404, 'NOT_FOUND', 'Cart item not found.')

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new HttpError(404, 'NOT_FOUND', 'Product not found.')

  assertPurchasable(product, quantity)
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } })
  return loadCart(userId)
}

export async function removeCartItem(userId: string, productId: string): Promise<CartDto> {
  const cart = await ensureCart(userId)
  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
    select: { id: true },
  })
  if (!item) throw new HttpError(404, 'NOT_FOUND', 'Cart item not found.')

  await prisma.cartItem.delete({ where: { id: item.id } })
  return loadCart(userId)
}
