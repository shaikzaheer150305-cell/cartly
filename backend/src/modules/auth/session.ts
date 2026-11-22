import { createHmac, randomBytes } from 'node:crypto'
import type { Response } from 'express'
import { isProduction, refreshTokenSecret } from '../../lib/env.js'

export const REFRESH_COOKIE = 'cartly_refresh'
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url')
}

export function hashRefreshToken(token: string): string {
  return createHmac('sha256', refreshTokenSecret()).update(token).digest('hex')
}

export function refreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_TTL_MS)
}

export function setRefreshCookie(response: Response, token: string): void {
  response.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TTL_MS,
  })
}

export function clearRefreshCookie(response: Response): void {
  response.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
  })
}
