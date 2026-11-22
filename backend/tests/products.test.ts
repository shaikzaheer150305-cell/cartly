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
const adminEmail = `admin.${suffix}@cartly.test`
const customerEmail = `customer.${suffix}@cartly.test`
const categorySlug = `crud-category-${suffix}`
const productSlug = `crud-product-${suffix}`

let server: Server
let baseUrl: string
let adminId: string
let customerId: string
let categoryId: string
let productId: string
let adminToken: string
let customerToken: string

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

function productInput(name: string, priceCents: number, stock: number) {
  return {
    name,
    slug: productSlug,
    description: 'A test product created by the product CRUD integration suite.',
    priceCents,
    stock,
    sku: `TEST-CRUD-${suffix}`,
    categoryId,
    images: ['https://placehold.co/600x400/png?text=CRUD'],
    isActive: true,
  }
}

describe('product CRUD API', () => {
  before(async () => {
    await prisma.$connect()
    const passwordHash = await bcrypt.hash(password, 10)
    const admin = await prisma.user.create({
      data: { name: 'CRUD Admin', email: adminEmail, passwordHash, role: 'ADMIN' },
    })
    const customer = await prisma.user.create({
      data: { name: 'CRUD Customer', email: customerEmail, passwordHash, role: 'CUSTOMER' },
    })
    const category = await prisma.category.create({
      data: { name: `CRUD ${suffix}`, slug: categorySlug, description: 'Temporary test category.' },
    })
    adminId = admin.id
    customerId = customer.id
    categoryId = category.id

    server = createApp().listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${address.port}/api`

    const adminLogin = await call('/auth/login', { method: 'POST', body: { email: adminEmail, password } })
    const customerLogin = await call('/auth/login', { method: 'POST', body: { email: customerEmail, password } })
    assert.equal(adminLogin.status, 200)
    assert.equal(customerLogin.status, 200)
    adminToken = adminLogin.body.accessToken as string
    customerToken = customerLogin.body.accessToken as string
  })

  after(async () => {
    await prisma.product.deleteMany({ where: { slug: productSlug } })
    await prisma.category.deleteMany({ where: { id: categoryId } })
    await prisma.user.deleteMany({ where: { id: { in: [adminId, customerId] } } })
    if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    await prisma.$disconnect()
  })

  it('rejects unauthenticated, customer, and invalid admin create requests', async () => {
    const input = productInput('CRUD Product', 2500, 5)
    assert.equal((await call('/products', { method: 'POST', body: input })).status, 401)
    assert.equal((await call('/products', { method: 'POST', token: customerToken, body: input })).status, 403)

    const invalid = await call('/products', {
      method: 'POST',
      token: adminToken,
      body: { ...input, name: '', priceCents: -1 },
    })
    assert.equal(invalid.status, 400)
    assert.equal(invalid.body.code, 'VALIDATION_ERROR')
  })

  it('creates a product', async () => {
    const result = await call('/products', {
      method: 'POST',
      token: adminToken,
      body: productInput('CRUD Product', 2500, 5),
    })
    assert.equal(result.status, 201)
    productId = result.body.id as string
    assert.ok(productId)
    assert.equal(result.body.priceCents, 2500)
    assert.deepEqual(result.body.images, ['https://placehold.co/600x400/png?text=CRUD'])
    assert.equal(result.body.deletedAt, null)
  })

  it('lists, filters, and reads the product', async () => {
    const list = await call(`/products?q=CRUD%20Product&category=${categorySlug}&page=1&limit=5`)
    assert.equal(list.status, 200)
    const items = list.body.items as Array<{ id: string }>
    assert.ok(items.some((item) => item.id === productId))
    assert.equal(list.body.page, 1)
    assert.equal(list.body.limit, 5)

    const byId = await call(`/products/${productId}`)
    assert.equal(byId.status, 200)
    assert.equal(byId.body.slug, productSlug)

    const bySlug = await call(`/products/slug/${productSlug}`)
    assert.equal(bySlug.status, 200)
    assert.equal(bySlug.body.id, productId)
  })

  it('updates the product', async () => {
    const result = await call(`/products/${productId}`, {
      method: 'PUT',
      token: adminToken,
      body: productInput('CRUD Product Updated', 3999, 2),
    })
    assert.equal(result.status, 200)
    assert.equal(result.body.name, 'CRUD Product Updated')
    assert.equal(result.body.priceCents, 3999)
    assert.equal(result.body.stock, 2)
  })

  it('soft-deletes the product and hides it from the storefront', async () => {
    const result = await call(`/products/${productId}`, { method: 'DELETE', token: adminToken })
    assert.equal(result.status, 200)
    assert.equal(result.body.isActive, false)
    assert.ok(result.body.deletedAt)

    assert.equal((await call(`/products/${productId}`)).status, 404)
    const adminRead = await call(`/products/${productId}`, { token: adminToken })
    assert.equal(adminRead.status, 200)

    const publicList = await call(`/products?q=CRUD%20Product&category=${categorySlug}`)
    const visibleItems = publicList.body.items as Array<{ id: string }>
    assert.equal(visibleItems.some((item) => item.id === productId), false)
  })
})
