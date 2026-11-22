import 'dotenv/config'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, before, describe, it } from 'node:test'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app.js'
import { pricingConfig } from '../src/lib/pricing.js'
import { prisma } from '../src/lib/prisma.js'

const suffix = Date.now().toString(36)
const password = 'OrderPass123!'
const adminEmail = `orders.admin.${suffix}@cartly.test`
const customerAEmail = `orders.customer-a.${suffix}@cartly.test`
const customerBEmail = `orders.customer-b.${suffix}@cartly.test`
const categorySlug = `orders-category-${suffix}`

let server: Server
let baseUrl: string
let categoryId: string
let adminId: string
let customerAId: string
let customerBId: string
let adminToken: string
let customerAToken: string
let customerBToken: string
const productIds: Record<string, string> = {}
let orderAId: string
let orderBId: string

interface TestOrderItem {
  productId: string
  name: string
  slug: string
  image: string
  unitPriceCents: number
  quantity: number
  lineTotalCents: number
  available: boolean
}

interface TestOrderEvent {
  id: string
  status: string
  actorType: string
  timestamp: string
  note: string
}

interface TestOrder {
  id: string
  orderNumber: string
  createdAt: string
  status: string
  customer: { name: string; email: string }
  items: TestOrderItem[]
  address: Record<string, unknown>
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  events: TestOrderEvent[]
}

interface CallResult {
  status: number
  body: Record<string, unknown>
}

const address = {
  fullName: 'Test Customer',
  phone: '5551234567',
  line1: '123 Test Street',
  line2: '',
  city: 'Testville',
  state: 'CA',
  postalCode: '12345',
  country: 'United States',
}

async function call(path: string, options: { method?: string; token?: string; body?: unknown } = {}): Promise<CallResult> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const text = await response.text()
  return {
    status: response.status,
    body: text ? JSON.parse(text) as Record<string, unknown> : {},
  }
}

function orderOf(body: Record<string, unknown>): TestOrder {
  return body as unknown as TestOrder
}

function pageOf(body: Record<string, unknown>): { items: TestOrder[]; total: number } {
  return body as unknown as { items: TestOrder[]; total: number }
}

function assertTotals(order: TestOrder, subtotalCents: number): void {
  const config = pricingConfig()
  const shippingCents =
    config.shippingIsActive &&
    (config.freeShippingThresholdCents === null || subtotalCents < config.freeShippingThresholdCents)
      ? config.shippingFlatCents
      : 0
  const taxCents = config.taxIsActive ? Math.round((subtotalCents * config.taxPercentBps) / 10000) : 0

  assert.equal(order.subtotalCents, subtotalCents)
  assert.equal(order.shippingCents, shippingCents)
  assert.equal(order.taxCents, taxCents)
  assert.equal(order.totalCents, subtotalCents + shippingCents + taxCents)
}

async function addToCart(token: string, productId: string, quantity: number): Promise<void> {
  const result = await call('/cart/items', {
    method: 'POST',
    token,
    body: { productId, quantity },
  })
  assert.equal(result.status, 200)
}

async function checkout(token: string, idempotencyKey: string): Promise<CallResult> {
  return call('/orders', {
    method: 'POST',
    token,
    body: { address, idempotencyKey },
  })
}

describe('order API', () => {
  before(async () => {
    await prisma.$connect()
    const passwordHash = await bcrypt.hash(password, 4)

    const [admin, customerA, customerB, category] = await prisma.$transaction([
      prisma.user.create({ data: { name: 'Orders Admin', email: adminEmail, passwordHash, role: 'ADMIN' } }),
      prisma.user.create({ data: { name: 'Orders Customer A', email: customerAEmail, passwordHash, role: 'CUSTOMER' } }),
      prisma.user.create({ data: { name: 'Orders Customer B', email: customerBEmail, passwordHash, role: 'CUSTOMER' } }),
      prisma.category.create({
        data: { name: `Orders ${suffix}`, slug: categorySlug, description: 'Temporary order test category.' },
      }),
    ])

    adminId = admin.id
    customerAId = customerA.id
    customerBId = customerB.id
    categoryId = category.id

    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Order Product A',
          slug: `order-a-${suffix}`,
          description: 'A product used by order tests.',
          priceCents: 2500,
          stock: 5,
          sku: `ORDER-A-${suffix}`,
          categoryId,
          imageUrls: ['https://placehold.co/600x400/png?text=A'],
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Order Product B',
          slug: `order-b-${suffix}`,
          description: 'Another product used by order tests.',
          priceCents: 1200,
          stock: 3,
          sku: `ORDER-B-${suffix}`,
          categoryId,
          imageUrls: ['https://placehold.co/600x400/png?text=B'],
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Order Unavailable',
          slug: `order-unavailable-${suffix}`,
          description: 'An unavailable product used by order tests.',
          priceCents: 900,
          stock: 1,
          sku: `ORDER-U-${suffix}`,
          categoryId,
          imageUrls: ['https://placehold.co/600x400/png?text=U'],
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Order Same Key',
          slug: `order-same-key-${suffix}`,
          description: 'A product used by idempotency tests.',
          priceCents: 700,
          stock: 1,
          sku: `ORDER-S-${suffix}`,
          categoryId,
          imageUrls: ['https://placehold.co/600x400/png?text=S'],
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Order Limited',
          slug: `order-limited-${suffix}`,
          description: 'A product used by concurrency tests.',
          priceCents: 800,
          stock: 1,
          sku: `ORDER-L-${suffix}`,
          categoryId,
          imageUrls: ['https://placehold.co/600x400/png?text=L'],
          isActive: true,
        },
      }),
    ])

    productIds.a = products[0].id
    productIds.b = products[1].id
    productIds.unavailable = products[2].id
    productIds.sameKey = products[3].id
    productIds.limited = products[4].id

    server = createApp().listen(0, '127.0.0.1')
    await once(server, 'listening')
    const serverAddress = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${serverAddress.port}/api`

    const adminLogin = await call('/auth/login', { method: 'POST', body: { email: adminEmail, password } })
    const customerALogin = await call('/auth/login', { method: 'POST', body: { email: customerAEmail, password } })
    const customerBLogin = await call('/auth/login', { method: 'POST', body: { email: customerBEmail, password } })
    assert.equal(adminLogin.status, 200)
    assert.equal(customerALogin.status, 200)
    assert.equal(customerBLogin.status, 200)
    adminToken = adminLogin.body.accessToken as string
    customerAToken = customerALogin.body.accessToken as string
    customerBToken = customerBLogin.body.accessToken as string
  })

  after(async () => {
    await prisma.order.deleteMany({ where: { userId: { in: [customerAId, customerBId] } } })
    await prisma.cart.deleteMany({ where: { userId: { in: [customerAId, customerBId] } } })
    await prisma.product.deleteMany({ where: { id: { in: Object.values(productIds) } } })
    await prisma.category.deleteMany({ where: { id: categoryId } })
    await prisma.user.deleteMany({ where: { id: { in: [adminId, customerAId, customerBId] } } })
    if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    await prisma.$disconnect()
  })

  it('requires an authenticated customer for checkout and admin for order management', async () => {
    assert.equal((await checkout('', 'guest-key-123')).status, 401)
    assert.equal((await checkout(adminToken, 'admin-key-123')).status, 403)
    assert.equal((await call('/orders/admin', { token: customerAToken })).status, 403)
    assert.equal((await call('/orders/admin', { token: adminToken })).status, 200)
  })

  it('creates an order with server prices, snapshots, stock updates, and simulated payment', async () => {
    await addToCart(customerAToken, productIds.a, 2)
    await addToCart(customerAToken, productIds.b, 1)
    await prisma.product.update({ where: { id: productIds.a }, data: { priceCents: 3000 } })

    const result = await checkout(customerAToken, `order-a-${suffix}`)
    assert.equal(result.status, 201)
    const order = orderOf(result.body)
    orderAId = order.id

    assert.equal(order.status, 'PAID')
    assert.match(order.orderNumber, /^CRT-/)
    assert.equal(order.items.length, 2)
    assert.equal(order.items[0].productId, productIds.a)
    assert.equal(order.items[0].name, 'Order Product A')
    assert.equal(order.items[0].unitPriceCents, 3000)
    assert.equal(order.items[0].quantity, 2)
    assert.equal(order.items[0].lineTotalCents, 6000)
    assert.equal(order.items[1].unitPriceCents, 1200)
    assertTotals(order, 7200)
    assert.equal(order.events.map((event) => event.status).join(','), 'PENDING_PAYMENT,PAID')
    assert.equal(order.events[1].actorType, 'SYSTEM')

    const productA = await prisma.product.findUniqueOrThrow({ where: { id: productIds.a } })
    const productB = await prisma.product.findUniqueOrThrow({ where: { id: productIds.b } })
    assert.equal(productA.stock, 3)
    assert.equal(productB.stock, 2)

    const cart = await call('/cart', { token: customerAToken })
    assert.equal((cart.body.items as unknown[]).length, 0)
  })

  it('returns the same order for repeated keys and scopes keys per customer', async () => {
    const duplicate = await checkout(customerAToken, `order-a-${suffix}`)
    assert.equal(duplicate.status, 201)
    assert.equal(orderOf(duplicate.body).id, orderAId)

    await addToCart(customerBToken, productIds.b, 1)
    const otherCustomer = await checkout(customerBToken, `order-a-${suffix}`)
    assert.equal(otherCustomer.status, 201)
    orderBId = orderOf(otherCustomer.body).id
    assert.notEqual(orderBId, orderAId)
    assert.equal(orderOf(otherCustomer.body).customer.email, customerBEmail)
  })

  it('prevents cross-customer access and supports admin lists, filters, and details', async () => {
    assert.equal((await call(`/orders/${orderAId}`, { token: customerBToken })).status, 404)
    assert.equal((await call(`/orders/${orderAId}`, { token: customerAToken })).status, 200)
    assert.equal((await call(`/orders/admin/${orderAId}`, { token: adminToken })).status, 200)

    const customerPage = pageOf((await call('/orders', { token: customerAToken })).body)
    assert.equal(customerPage.total, 1)
    assert.equal(customerPage.items[0].id, orderAId)

    const adminPage = pageOf((await call('/orders/admin?status=PAID', { token: adminToken })).body)
    assert.equal(adminPage.total, 2)
    assert.deepEqual(adminPage.items.map((order) => order.id).sort(), [orderAId, orderBId].sort())

    const filtered = pageOf((await call(`/orders/admin?customer=${encodeURIComponent(customerAEmail)}`, { token: adminToken })).body)
    assert.equal(filtered.total, 1)
    assert.equal(filtered.items[0].id, orderAId)
  })

  it('enforces allowed status transitions and records events', async () => {
    assert.equal((await call(`/orders/${orderAId}/status`, {
      method: 'PATCH',
      token: customerAToken,
      body: { status: 'PROCESSING' },
    })).status, 403)

    const processing = await call(`/orders/${orderAId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'PROCESSING' },
    })
    assert.equal(processing.status, 200)
    assert.equal(orderOf(processing.body).status, 'PROCESSING')

    const shipped = await call(`/orders/${orderAId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'SHIPPED' },
    })
    assert.equal(shipped.status, 200)

    const delivered = await call(`/orders/${orderAId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'DELIVERED' },
    })
    assert.equal(delivered.status, 200)

    const invalid = await call(`/orders/${orderAId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'PROCESSING' },
    })
    assert.equal(invalid.status, 409)
    assert.equal(invalid.body.code, 'INVALID_TRANSITION')
    assert.deepEqual(invalid.body.details, { allowed: [] })

    const detail = orderOf((await call('/orders/admin/' + orderAId, { token: adminToken })).body)
    assert.equal(detail.status, 'DELIVERED')
    assert.equal(detail.events.length, 5)
    assert.deepEqual(detail.events.map((event) => event.status), [
      'PENDING_PAYMENT',
      'PAID',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
    ])
  })

  it('rejects unavailable stock without changing stock or the cart', async () => {
    await addToCart(customerAToken, productIds.unavailable, 1)
    await prisma.product.update({ where: { id: productIds.unavailable }, data: { stock: 0 } })

    const failed = await checkout(customerAToken, `unavailable-${suffix}`)
    assert.equal(failed.status, 409)
    assert.equal(failed.body.code, 'OUT_OF_STOCK')

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productIds.unavailable } })
    assert.equal(product.stock, 0)
    const cart = await call('/cart', { token: customerAToken })
    assert.equal((cart.body.items as unknown[]).length, 1)

    const removed = await call(`/cart/items/${productIds.unavailable}`, {
      method: 'DELETE',
      token: customerAToken,
    })
    assert.equal(removed.status, 200)
  })

  it('restores stock when a customer cancels a confirmed order', async () => {
    const before = await prisma.product.findUniqueOrThrow({ where: { id: productIds.b } })
    const cancelled = await call(`/orders/${orderBId}/cancel`, { method: 'POST', token: customerBToken })
    assert.equal(cancelled.status, 200)
    assert.equal(orderOf(cancelled.body).status, 'CANCELLED')
    assert.equal(orderOf(cancelled.body).events.at(-1)?.status, 'CANCELLED')

    const after = await prisma.product.findUniqueOrThrow({ where: { id: productIds.b } })
    assert.equal(after.stock, before.stock + 1)
  })

  it('handles repeated and concurrent checkouts safely', async () => {
    await addToCart(customerAToken, productIds.sameKey, 1)
    const sameKey = `same-key-${suffix}`
    const [first, second] = await Promise.all([checkout(customerAToken, sameKey), checkout(customerAToken, sameKey)])
    assert.equal(first.status, 201, JSON.stringify(first.body))
    assert.equal(second.status, 201, JSON.stringify(second.body))
    assert.equal(orderOf(first.body).id, orderOf(second.body).id)

    await addToCart(customerAToken, productIds.limited, 1)
    await addToCart(customerBToken, productIds.limited, 1)
    const results = await Promise.all([
      checkout(customerAToken, `limited-a-${suffix}`),
      checkout(customerBToken, `limited-b-${suffix}`),
    ])
    assert.deepEqual(results.map((result) => result.status).sort(), [201, 409])

    const limited = await prisma.product.findUniqueOrThrow({ where: { id: productIds.limited } })
    assert.equal(limited.stock, 0)
    const successfulOrders = await prisma.order.count({
      where: { idempotencyKey: { in: [`limited-a-${suffix}`, `limited-b-${suffix}`] } },
    })
    assert.equal(successfulOrders, 1)
  })
})
