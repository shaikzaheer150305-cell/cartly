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
const password = 'AuthPass123!'
const customerEmail = `auth.customer.${suffix}@cartly.test`
const adminEmail = `auth.admin.${suffix}@cartly.test`
const registeredEmail = `auth.registered.${suffix}@cartly.test`

let server: Server
let baseUrl: string
let customerId: string
let adminId: string
let registeredId: string
let customerToken: string
let adminToken: string
let customerCookie: string
let adminCookie: string

interface CallResult {
  status: number
  body: Record<string, unknown>
  cookie: string | null
  setCookie: string | null
}

async function call(path: string, options: { method?: string; token?: string; cookie?: string; body?: unknown } = {}): Promise<CallResult> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`
  if (options.cookie) headers.Cookie = options.cookie

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const text = await response.text()
  const setCookie = response.headers.get('set-cookie')
  return {
    status: response.status,
    body: text ? JSON.parse(text) as Record<string, unknown> : {},
    cookie: setCookie ? setCookie.split(';')[0] : null,
    setCookie,
  }
}

describe('authentication API', () => {
  before(async () => {
    await prisma.$connect()
    const passwordHash = await bcrypt.hash(password, 4)
    const customer = await prisma.user.create({
      data: { name: 'Auth Customer', email: customerEmail, passwordHash, role: 'CUSTOMER' },
    })
    const admin = await prisma.user.create({
      data: { name: 'Auth Admin', email: adminEmail, passwordHash, role: 'ADMIN' },
    })
    customerId = customer.id
    adminId = admin.id

    server = createApp().listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${address.port}/api`
  })

  after(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [customerId, adminId, registeredId] } } })
    if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    await prisma.$disconnect()
  })

  it('validates registration input', async () => {
    const badEmail = await call('/auth/register', {
      method: 'POST',
      body: { name: 'Test User', email: 'not-an-email', password },
    })
    assert.equal(badEmail.status, 400)
    assert.equal(badEmail.body.code, 'VALIDATION_ERROR')

    const shortPassword = await call('/auth/register', {
      method: 'POST',
      body: { name: 'Test User', email: `short.${suffix}@cartly.test`, password: 'short' },
    })
    assert.equal(shortPassword.status, 400)
  })

  it('registers a customer without returning a password hash', async () => {
    const result = await call('/auth/register', {
      method: 'POST',
      body: { name: 'Registered Customer', email: registeredEmail, password, role: 'ADMIN' },
    })
    assert.equal(result.status, 201)
    const user = result.body.user as Record<string, unknown>
    assert.equal(user.role, 'CUSTOMER')
    assert.equal(user.email, registeredEmail)
    assert.equal('passwordHash' in user, false)
    assert.equal('password' in user, false)
    assert.ok(result.body.accessToken)
    assert.match(result.setCookie ?? '', /^cartly_refresh=/)
    assert.match(result.setCookie ?? '', /HttpOnly/i)
    assert.match(result.setCookie ?? '', /SameSite=Lax/i)

    registeredId = user.id as string
    customerToken = result.body.accessToken as string
    customerCookie = result.cookie!

    const duplicate = await call('/auth/register', {
      method: 'POST',
      body: { name: 'Registered Customer', email: registeredEmail, password },
    })
    assert.equal(duplicate.status, 409)
    assert.equal(duplicate.body.code, 'EMAIL_TAKEN')
  })

  it('logs in customers and admins, ignoring a client-supplied role', async () => {
    const customerLogin = await call('/auth/login', {
      method: 'POST',
      body: { email: customerEmail, password, role: 'ADMIN' },
    })
    assert.equal(customerLogin.status, 200)
    assert.equal((customerLogin.body.user as Record<string, unknown>).role, 'CUSTOMER')
    customerToken = customerLogin.body.accessToken as string
    customerCookie = customerLogin.cookie!

    const adminLogin = await call('/auth/admin/login', {
      method: 'POST',
      body: { email: adminEmail, password },
    })
    assert.equal(adminLogin.status, 200)
    assert.equal((adminLogin.body.user as Record<string, unknown>).role, 'ADMIN')
    adminToken = adminLogin.body.accessToken as string
    adminCookie = adminLogin.cookie!

    const customerAsAdmin = await call('/auth/admin/login', {
      method: 'POST',
      body: { email: customerEmail, password },
    })
    assert.equal(customerAsAdmin.status, 401)
    assert.equal(customerAsAdmin.body.code, 'INVALID_CREDENTIALS')
  })

  it('rejects unauthenticated requests and customer access to admin APIs', async () => {
    assert.equal((await call('/auth/me')).status, 401)
    const me = await call('/auth/me', { token: customerToken })
    assert.equal(me.status, 200)
    assert.equal((me.body as Record<string, unknown>).email, customerEmail)
    assert.equal((await call('/products', { method: 'POST', body: {} })).status, 401)
    assert.equal((await call('/products', { method: 'POST', token: customerToken, body: {} })).status, 403)
  })

  it('rotates refresh cookies and rejects replayed tokens', async () => {
    const previousCookie = customerCookie
    const refreshed = await call('/auth/refresh', { method: 'POST', cookie: previousCookie })
    assert.equal(refreshed.status, 200)
    assert.ok(refreshed.cookie)
    assert.notEqual(refreshed.cookie, previousCookie)

    const replay = await call('/auth/refresh', { method: 'POST', cookie: previousCookie })
    assert.equal(replay.status, 401)
    assert.equal(replay.body.code, 'INVALID_SESSION')
  })

  it('logs out by revoking the session and clearing the cookie', async () => {
    const logout = await call('/auth/logout', { method: 'POST', cookie: adminCookie })
    assert.equal(logout.status, 204)
    assert.match(logout.setCookie ?? '', /Max-Age=0|Expires=/i)

    assert.equal((await call('/auth/me', { token: adminToken })).status, 401)
    assert.equal((await call('/auth/refresh', { method: 'POST', cookie: adminCookie })).status, 401)
  })
})
