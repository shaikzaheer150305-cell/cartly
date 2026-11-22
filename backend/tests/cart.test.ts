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
const password = 'CartPass123!'
const adminEmail = `cart.admin.${suffix}@cartly.test`
const customerAEmail = `cart.customer-a.${suffix}@cartly.test`
const customerBEmail = `cart.customer-b.${suffix}@cartly.test`
const categorySlug = `cart-category-${suffix}`

let server: Server
let baseUrl: string
let categoryId: string
let customerAId: string
let customerBId: string
let adminId: string
let customerAToken: string
let customerBToken: string
let adminToken: string
const productIds: Record<string, string> = {}

interface TestCartItem {
  productId: string
  name: string
  slug: string
  image: string
  unitPriceCents: number
  quantity: number
  maxQuantity: number
  available: boolean
}

interface TestCart {
  items: TestCartItem[]
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  freeShippingThresholdCents: number | null
}

interface CallResult {
  status: number
  body: Record<string, unknown>
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

function cartOf(body: Record<string, unknown>): TestCart {
  return body as unknown as TestCart
}

function assertTotals(cart: TestCart, subtotalCents: number): void {
  const config = pricingConfig()
  const shippingCents =
    config.shippingIsActive &&
    (config.freeShippingThresholdCents === null || subtotalCents < config.freeShippingThresholdCents)
      ? config.shippingFlatCents
      : 0
  const taxCents = config.taxIsActive ? Math.round((subtotalCents * config.taxPercentBps) / 10000) : 0

  assert.equal(cart.subtotalCents, subtotalCents)
  assert.equal(cart.shippingCents, shippingCents)
  assert.equal(cart.taxCents, taxCents)
  assert.equal(cart.totalCents, subtotalCents + shippingCents + taxCents)
}

describe('cart API', () => {
  before(async () => {
    await prisma.$connect()
    const passwordHash = await bcrypt.hash(password, 4)

    const [admin, customerA, customerB, category] = await prisma.$transaction([
      prisma.user.create({
        data: { name: 'Cart Admin', email: adminEmail, passwordHash, role: 'ADMIN' },
      }),
      prisma.user.create({
        data: { name: 'Cart Customer A', email: customerAEmail, passwordHash, role: 'CUSTOMER' },
      }),
      prisma.user.create({
        data: { name: 'Cart Customer B', email: customerBEmail, passwordHash, role: 'CUSTOMER' },
      }),
      prisma.category.create({
        data: { name: `Cart ${suffix}`, slug: categorySlug, description: 'Temporary cart test category.' },
      }),
    ])

    adminId = admin.id
    customerAId = customerA.id
    customerBId = customerB.id
    categoryId = category.id

    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Cart In Stock',
          slug: `cart-in-stock-${suffix}`,
          description: 'A product used by cart API tests.',
          priceCents: 2500,
          stock: 5,
          sku: `CART-A-${suffix}`,
          categoryId,
          imageUrls: ['https://placehold.co/600x400/png?text=CART-A'],
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Cart Other',
          slug: `cart-other-${suffix}`,
          description: 'A second product used by cart API tests.',
          priceCents: 1200,
          stock: 10,
          sku: `CART-B-${suffix}`,
          categoryId,
          imageUrls: ['https://placehold.co/600x400/png?text=CART-B'],
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Cart Inactive',
          slug: `cart-inactive-${suffix}`,
          description: 'An inactive product used by cart API tests.',
          priceCents: 1700,
          stock: 3,
          sku: `CART-C-${suffix}`,
          categoryId,
          imageUrls: ['https://placehold.co/600x400/png?text=CART-C'],
          isActive: false,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Cart Zero Stock',
          slug: `cart-zero-${suffix}`,
          description: 'An empty-stock product used by cart API tests.',
          priceCents: 1900,
          stock: 0,
          sku: `CART-D-${suffix}`,
          categoryId,
          imageUrls: ['https://placehold.co/600x400/png?text=CART-D'],
          isActive: true,
        },
      }),
    ])

    productIds.inStock = products[0].id
    productIds.other = products[1].id
    productIds.inactive = products[2].id
    productIds.zeroStock = products[3].id

    server = createApp().listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${address.port}/api`

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
    await prisma.cartItem.deleteMany({ where: { productId: { in: Object.values(productIds) } } })
    await prisma.cart.deleteMany({ where: { userId: { in: [customerAId, customerBId] } } })
    await prisma.product.deleteMany({ where: { id: { in: Object.values(productIds) } } })
    await prisma.category.deleteMany({ where: { id: categoryId } })
    await prisma.user.deleteMany({ where: { id: { in: [adminId, customerAId, customerBId] } } })
    if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    await prisma.$disconnect()
  })

  it('requires an authenticated customer', async () => {
    assert.equal((await call('/cart')).status, 401)
    assert.equal((await call('/cart', { token: adminToken })).status, 403)
  })

  it('keeps each customer cart separate', async () => {
    const initialA = await call('/cart', { token: customerAToken })
    assert.equal(initialA.status, 200)
    assert.equal(cartOf(initialA.body).items.length, 0)

    const addA = await call('/cart/items', {
      method: 'POST',
      token: customerAToken,
      body: { productId: productIds.inStock, quantity: 2 },
    })
    assert.equal(addA.status, 200)
    const cartA = cartOf(addA.body)
    assert.equal(cartA.items.length, 1)
    assert.equal(cartA.items[0].quantity, 2)
    assert.equal(cartA.items[0].unitPriceCents, 2500)
    assertTotals(cartA, 5000)

    const initialB = await call('/cart', { token: customerBToken })
    assert.equal(initialB.status, 200)
    assert.equal(cartOf(initialB.body).items.length, 0)

    const addB = await call('/cart/items', {
      method: 'POST',
      token: customerBToken,
      body: { productId: productIds.other, quantity: 1 },
    })
    assert.equal(addB.status, 200)
    const cartB = cartOf(addB.body)
    assert.equal(cartB.items.length, 1)
    assert.equal(cartB.items[0].productId, productIds.other)
    assertTotals(cartB, 1200)
  })

  it('adds items incrementally and rejects invalid or unavailable adds', async () => {
    for (const quantity of [0, -1, 1.5, 100]) {
      const result = await call('/cart/items', {
        method: 'POST',
        token: customerAToken,
        body: { productId: productIds.inStock, quantity },
      })
      assert.equal(result.status, 400)
    }

    const overStock = await call('/cart/items', {
      method: 'POST',
      token: customerAToken,
      body: { productId: productIds.inStock, quantity: 4 },
    })
    assert.equal(overStock.status, 409)
    assert.equal(overStock.body.code, 'OUT_OF_STOCK')

    assert.equal((await call('/cart/items', {
      method: 'POST',
      token: customerAToken,
      body: { productId: productIds.inactive, quantity: 1 },
    })).status, 409)
    assert.equal((await call('/cart/items', {
      method: 'POST',
      token: customerAToken,
      body: { productId: productIds.zeroStock, quantity: 1 },
    })).status, 409)
    assert.equal((await call('/cart/items', {
      method: 'POST',
      token: customerAToken,
      body: { productId: 'missing-product', quantity: 1 },
    })).status, 404)

    const added = await call('/cart/items', {
      method: 'POST',
      token: customerAToken,
      body: { productId: productIds.inStock, quantity: 1 },
    })
    assert.equal(added.status, 200)
    const cart = cartOf(added.body)
    assert.equal(cart.items[0].quantity, 3)
    assertTotals(cart, 7500)
  })

  it('updates quantities with stock and validation checks', async () => {
    const updated = await call(`/cart/items/${productIds.inStock}`, {
      method: 'PATCH',
      token: customerAToken,
      body: { quantity: 1 },
    })
    assert.equal(updated.status, 200)
    assert.equal(cartOf(updated.body).items[0].quantity, 1)
    assertTotals(cartOf(updated.body), 2500)

    const invalid = await call(`/cart/items/${productIds.inStock}`, {
      method: 'PATCH',
      token: customerAToken,
      body: { quantity: 0 },
    })
    assert.equal(invalid.status, 400)

    const overStock = await call(`/cart/items/${productIds.inStock}`, {
      method: 'PATCH',
      token: customerAToken,
      body: { quantity: 6 },
    })
    assert.equal(overStock.status, 409)
    assert.equal(overStock.body.code, 'OUT_OF_STOCK')

    const missing = await call(`/cart/items/${productIds.other}`, {
      method: 'PATCH',
      token: customerAToken,
      body: { quantity: 1 },
    })
    assert.equal(missing.status, 404)
  })

  it('marks unavailable cart items without changing stored quantities', async () => {
    await prisma.product.update({
      where: { id: productIds.inStock },
      data: { isActive: false },
    })

    const cartResponse = await call('/cart', { token: customerAToken })
    assert.equal(cartResponse.status, 200)
    const item = cartOf(cartResponse.body).items[0]
    assert.equal(item.available, false)
    assert.equal(item.quantity, 1)

    await prisma.product.update({
      where: { id: productIds.inStock },
      data: { isActive: true },
    })
  })

  it('removes items and recalculates totals', async () => {
    const removed = await call(`/cart/items/${productIds.inStock}`, {
      method: 'DELETE',
      token: customerAToken,
    })
    assert.equal(removed.status, 200)
    const cart = cartOf(removed.body)
    assert.equal(cart.items.length, 0)
    assertTotals(cart, 0)

    const missing = await call(`/cart/items/${productIds.inStock}`, {
      method: 'DELETE',
      token: customerAToken,
    })
    assert.equal(missing.status, 404)
  })
})
