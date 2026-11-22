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
const adminEmail = `cat-admin.${suffix}@cartly.test`
const customerEmail = `cat-customer.${suffix}@cartly.test`
const categorySlug = `cat-${suffix}`
const productSlug = `cat-product-${suffix}`

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

function categoryInput(name: string, slug: string) {
  return { name, slug, description: 'Temporary category used by the integration suite.' }
}

describe('category management and admin stats API', () => {
  before(async () => {
    await prisma.$connect()
    const passwordHash = await bcrypt.hash(password, 10)
    const admin = await prisma.user.create({
      data: { name: 'Category Admin', email: adminEmail, passwordHash, role: 'ADMIN' },
    })
    const customer = await prisma.user.create({
      data: { name: 'Category Customer', email: customerEmail, passwordHash, role: 'CUSTOMER' },
    })
    adminId = admin.id
    customerId = customer.id

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
    await prisma.orderItem.deleteMany({ where: { product: { slug: productSlug } } })
    await prisma.cartItem.deleteMany({ where: { product: { slug: productSlug } } })
    await prisma.product.deleteMany({ where: { slug: productSlug } })
    if (categoryId) await prisma.category.delete({ where: { id: categoryId } }).catch(() => undefined)
    const userIds = [adminId, customerId].filter(Boolean)
    if (userIds.length > 0) await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    await prisma.$disconnect()
  })

  it('requires an admin for category writes and validates input', async () => {
    const input = categoryInput(`Category ${suffix}`, categorySlug)
    assert.equal((await call('/categories', { method: 'POST', body: input })).status, 401)
    assert.equal((await call('/categories', { method: 'POST', token: customerToken, body: input })).status, 403)
    const invalid = await call('/categories', { method: 'POST', token: adminToken, body: { ...input, slug: 'Not A Slug' } })
    assert.equal(invalid.status, 400)
  })

  it('creates, lists, updates, and deletes categories', async () => {
    const created = await call('/categories', {
      method: 'POST',
      token: adminToken,
      body: categoryInput(`Category ${suffix}`, categorySlug),
    })
    assert.equal(created.status, 201)
    categoryId = created.body.id as string
    assert.equal(created.body.productCount, 0)

    const duplicate = await call('/categories', {
      method: 'POST',
      token: adminToken,
      body: categoryInput(`Other ${suffix}`, categorySlug),
    })
    assert.equal(duplicate.status, 409)

    const list = await call('/categories')
    assert.equal(list.status, 200)
    assert.ok((list.body as unknown[]).some((entry) => (entry as { id: string }).id === categoryId))

    const updated = await call(`/categories/${categoryId}`, {
      method: 'PATCH',
      token: adminToken,
      body: categoryInput(`Updated ${suffix}`, categorySlug),
    })
    assert.equal(updated.status, 200)
    assert.equal(updated.body.name, `Updated ${suffix}`)
  })

  it('refuses to delete a category referenced by a product, including soft-deleted products', async () => {
    const product = await prisma.product.create({
      data: {
        name: `Category Product ${suffix}`,
        slug: productSlug,
        description: 'Temporary product used to verify category reference protection.',
        priceCents: 1999,
        stock: 1,
        categoryId,
        imageUrls: ['https://placehold.co/600x400/png?text=Category'],
      },
    })
    productId = product.id
    await prisma.product.update({ where: { id: productId }, data: { deletedAt: new Date() } })

    const blocked = await call(`/categories/${categoryId}`, { method: 'DELETE', token: adminToken })
    assert.equal(blocked.status, 409)
    assert.equal(blocked.body.code, 'CATEGORY_IN_USE')
    assert.equal(blocked.body.details && (blocked.body.details as { count?: number }).count, 1)
  })

  it('deletes an unreferenced category and serves database-backed admin stats', async () => {
    await prisma.product.delete({ where: { id: productId } })
    const deleted = await call(`/categories/${categoryId}`, { method: 'DELETE', token: adminToken })
    assert.equal(deleted.status, 204)

    const forbidden = await call('/admin/stats', { token: customerToken })
    assert.equal(forbidden.status, 403)

    const stats = await call('/admin/stats', { token: adminToken })
    assert.equal(stats.status, 200)
    for (const key of ['products', 'activeProducts', 'orders', 'needsAttention']) {
      assert.equal(typeof stats.body[key], 'number')
      assert.ok((stats.body[key] as number) >= 0)
    }
    assert.ok((stats.body.activeProducts as number) <= (stats.body.products as number))
    assert.ok((stats.body.needsAttention as number) <= (stats.body.orders as number))
  })
})
