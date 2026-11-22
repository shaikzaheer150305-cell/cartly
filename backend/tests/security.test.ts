import 'dotenv/config'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, before, describe, it } from 'node:test'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'

const suffix = Date.now().toString(36)
const password = 'TestPass123!'
const adminEmail = `sec-admin.${suffix}@cartly.test`
const customerAEmail = `sec-a.${suffix}@cartly.test`
const customerBEmail = `sec-b.${suffix}@cartly.test`
const categorySlug = `sec-category-${suffix}`
const productSlug = `sec-product-${suffix}`
const orderNumber = `SEC-${suffix}`

let server: Server
let baseUrl: string
let adminId: string
let customerAId: string
let customerBId: string
let categoryId: string
let productId: string
let orderId: string
let adminToken: string
let customerAToken: string
let customerBToken: string

interface CallResult {
  status: number
  body: Record<string, unknown>
}

async function call(path: string, options: { method?: string; token?: string; body?: unknown; origin?: string } = {}): Promise<CallResult> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`
  if (options.origin) headers.Origin = options.origin

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

describe('security and boundary tests', () => {
  before(async () => {
    await prisma.$connect()
    const passwordHash = await bcrypt.hash(password, 10)
    const admin = await prisma.user.create({ data: { name: 'Security Admin', email: adminEmail, passwordHash, role: 'ADMIN' } })
    const customerA = await prisma.user.create({ data: { name: 'Security A', email: customerAEmail, passwordHash, role: 'CUSTOMER' } })
    const customerB = await prisma.user.create({ data: { name: 'Security B', email: customerBEmail, passwordHash, role: 'CUSTOMER' } })
    const category = await prisma.category.create({ data: { name: `Security ${suffix}`, slug: categorySlug } })
    const product = await prisma.product.create({
      data: {
        name: `Security Product ${suffix}`,
        slug: productSlug,
        description: 'A temporary product used by the security integration suite.',
        priceCents: 2500,
        stock: 10,
        sku: `SEC-SKU-${suffix}`,
        categoryId: category.id,
        imageUrls: ['https://placehold.co/600x400/png?text=Security'],
      },
    })
    adminId = admin.id
    customerAId = customerA.id
    customerBId = customerB.id
    categoryId = category.id
    productId = product.id

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
    if (orderId) await prisma.order.deleteMany({ where: { id: orderId } })
    if (productId) await prisma.cartItem.deleteMany({ where: { productId } })
    if (productId) await prisma.orderItem.deleteMany({ where: { productId } })
    if (productId) await prisma.product.deleteMany({ where: { id: productId } })
    if (categoryId) await prisma.category.delete({ where: { id: categoryId } }).catch(() => undefined)
    const userIds = [adminId, customerAId, customerBId].filter(Boolean)
    if (userIds.length > 0) await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    await prisma.$disconnect()
  })

  it('rejects unauthenticated access to private APIs', async () => {
    assert.equal((await call('/cart')).status, 401)
    assert.equal((await call('/orders')).status, 401)
    assert.equal((await call('/orders', { method: 'POST', body: {} })).status, 401)
    assert.equal((await call('/admin/stats')).status, 401)
    assert.equal((await call('/products', { method: 'POST', body: {} })).status, 401)
    assert.equal((await call('/categories', { method: 'POST', body: {} })).status, 401)
  })

  it('rejects customer attempts at admin operations', async () => {
    assert.equal((await call('/admin/stats', { token: customerAToken })).status, 403)
    assert.equal((await call('/orders/admin', { token: customerAToken })).status, 403)
    assert.equal((await call('/products', { method: 'POST', token: customerAToken, body: {} })).status, 403)
    assert.equal((await call(`/products/${productId}`, { method: 'DELETE', token: customerAToken })).status, 403)
    assert.equal((await call('/categories', { method: 'POST', token: customerAToken, body: {} })).status, 403)
    assert.equal((await call(`/categories/${categoryId}`, { method: 'PATCH', token: customerAToken, body: {} })).status, 403)
    assert.equal((await call(`/categories/${categoryId}`, { method: 'DELETE', token: customerAToken })).status, 403)
    assert.equal((await call('/orders/invalid/status', { method: 'PATCH', token: customerAToken, body: { status: 'DELIVERED' } })).status, 403)
  })

  it('prevents customers from reading another customer cart', async () => {
    const added = await call('/cart/items', { method: 'POST', token: customerAToken, body: { productId, quantity: 1 } })
    assert.equal(added.status, 200)

    const ownCart = await call('/cart', { token: customerAToken })
    assert.ok((ownCart.body.items as unknown[]).some((item) => (item as { productId: string }).productId === productId))

    const otherCart = await call(`/cart?userId=${customerAId}`, { token: customerBToken })
    assert.equal((otherCart.body.items as unknown[]).length, 0)

    assert.equal((await call(`/cart/${customerAId}`, { token: customerBToken })).status, 404)
  })

  it('prevents customers from reading another customer order', async () => {
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: customerAId,
        status: 'PAID',
        shippingAddress: { fullName: 'Security A', phone: '5551234', line1: '1 Test St', line2: '', city: 'Test', state: 'TS', postalCode: '10000', country: 'United States' },
        subtotalCents: 2500,
        shippingCents: 999,
        taxCents: 0,
        totalCents: 3499,
      },
    })
    orderId = order.id

    assert.equal((await call(`/orders/${order.id}`, { token: customerBToken })).status, 404)
    const list = await call(`/orders?userId=${customerAId}`, { token: customerBToken })
    assert.equal(list.status, 200)
    assert.equal((list.body.items as unknown[]).length, 0)

    const own = await call(`/orders/${order.id}`, { token: customerAToken })
    assert.equal(own.status, 200)
  })

  it('returns client errors for invalid identifiers, prices, and quantities', async () => {
    assert.equal((await call('/products/not-a-real-id')).status, 404)
    assert.equal((await call('/orders/not-a-real-id', { token: customerAToken })).status, 404)
    assert.equal((await call('/categories/not-a-real-id', { method: 'DELETE', token: adminToken })).status, 404)

    const baseProduct = {
      name: `Invalid Product ${suffix}`,
      slug: `invalid-product-${suffix}`,
      description: 'A temporary product used by the security integration suite.',
      priceCents: 1000,
      stock: 1,
      sku: `INVALID-${suffix}`,
      categoryId,
      images: ['https://placehold.co/600x400/png?text=Invalid'],
      isActive: true,
    }
    assert.equal((await call('/products', { method: 'POST', token: adminToken, body: { ...baseProduct, priceCents: -1 } })).status, 400)
    assert.equal((await call('/products', { method: 'POST', token: adminToken, body: { ...baseProduct, stock: 1.5 } })).status, 400)

    assert.equal((await call('/cart/items', { method: 'POST', token: customerAToken, body: { productId, quantity: 0 } })).status, 400)
    assert.equal((await call('/cart/items', { method: 'POST', token: customerAToken, body: { productId, quantity: 1.5 } })).status, 400)
    assert.equal((await call('/cart/items', { method: 'POST', token: customerAToken, body: { productId, quantity: 100 } })).status, 400)
  })

  it('rejects cross-origin state changes on admin APIs', async () => {
    const productCreate = await call('/products', {
      method: 'POST',
      token: adminToken,
      origin: 'https://evil.example',
      body: {},
    })
    assert.equal(productCreate.status, 403)
    assert.equal(productCreate.body.code, 'CSRF_REJECTED')
  })

  it('treats SQL injection and malicious input as data, not executable input', async () => {
    const injection = "' OR 1=1 --"
    const search = await call(`/products?q=${encodeURIComponent(injection)}`)
    assert.equal(search.status, 200)
    assert.equal((search.body.items as unknown[]).length, 0)

    const categoryFilter = await call(`/products?category=${encodeURIComponent(injection)}`)
    assert.equal(categoryFilter.status, 200)
    assert.equal((categoryFilter.body.items as unknown[]).length, 0)

    const maliciousCategory = await call('/categories', {
      method: 'POST',
      token: adminToken,
      body: { name: `XSS ${suffix}`, slug: '<script>alert(1)</script>', description: '' },
    })
    assert.equal(maliciousCategory.status, 400)

    const maliciousProduct = await call('/products', {
      method: 'POST',
      token: adminToken,
      body: {
        name: `XSS Product ${suffix}`,
        slug: `xss-product-${suffix}`,
        description: 'A temporary product used by the security integration suite.',
        priceCents: 1000,
        stock: 1,
        sku: `XSS-${suffix}`,
        categoryId,
        images: ['javascript:alert(1)'],
        isActive: true,
      },
    })
    assert.equal(maliciousProduct.status, 400)
  })
})
