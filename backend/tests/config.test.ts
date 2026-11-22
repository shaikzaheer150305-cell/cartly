import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { afterEach, describe, it } from 'node:test'
import { validateProductionEnv } from '../src/lib/env.js'

const managedKeys = [
  'NODE_ENV',
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'WEB_ORIGIN',
  'PORT',
  'TRUST_PROXY',
]

const original = new Map(managedKeys.map((key) => [key, process.env[key]]))

function setValidProductionEnv(): void {
  process.env.NODE_ENV = 'production'
  process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@db.internal:5432/cartly?schema=public'
  process.env.DIRECT_URL = 'postgresql://placeholder:placeholder@db.internal:5432/cartly?schema=public'
  process.env.JWT_ACCESS_SECRET = randomBytes(48).toString('hex')
  process.env.JWT_REFRESH_SECRET = randomBytes(48).toString('hex')
  process.env.WEB_ORIGIN = 'https://shop.example.com'
  process.env.PORT = '4000'
  process.env.TRUST_PROXY = '1'
}

afterEach(() => {
  for (const key of managedKeys) {
    const value = original.get(key)
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('production configuration validation', () => {
  it('accepts complete production configuration', () => {
    setValidProductionEnv()
    assert.doesNotThrow(() => validateProductionEnv())
  })

  it('rejects weak or duplicated secrets', () => {
    setValidProductionEnv()
    process.env.JWT_ACCESS_SECRET = 'too-short'
    assert.throws(() => validateProductionEnv(), /Invalid production configuration/)

    setValidProductionEnv()
    process.env.JWT_REFRESH_SECRET = process.env.JWT_ACCESS_SECRET
    assert.throws(() => validateProductionEnv(), /Invalid production configuration/)
  })

  it('rejects a non-HTTPS web origin', () => {
    setValidProductionEnv()
    process.env.WEB_ORIGIN = 'http://shop.example.com'
    assert.throws(() => validateProductionEnv(), /Invalid production configuration/)
  })

  it('rejects missing required values', () => {
    setValidProductionEnv()
    delete process.env.DIRECT_URL
    assert.throws(() => validateProductionEnv(), /Invalid production configuration/)
  })
})
