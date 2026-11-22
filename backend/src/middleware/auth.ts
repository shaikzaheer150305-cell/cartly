import jwt from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import { jwtAccessSecret } from '../lib/env.js'
import { HttpError } from '../lib/httpError.js'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from './asyncHandler.js'

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'ADMIN'
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser
    }
  }
}

function bearerToken(header: string | undefined): string | null {
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1] : null
}

async function loadUser(token: string): Promise<AuthenticatedUser> {
  let payload: jwt.JwtPayload
  try {
    payload = jwt.verify(token, jwtAccessSecret()) as jwt.JwtPayload
  } catch {
    throw new HttpError(401, 'INVALID_TOKEN', 'Your session is invalid. Please sign in again.')
  }

  const userId = typeof payload.sub === 'string' ? payload.sub : ''
  const sessionId = typeof payload.sid === 'string' ? payload.sid : ''
  if (!userId || !sessionId) {
    throw new HttpError(401, 'INVALID_TOKEN', 'Your session is invalid. Please sign in again.')
  }

  const session = await prisma.refreshToken.findUnique({
    where: { id: sessionId },
    select: { userId: true, revokedAt: true, expiresAt: true },
  })
  if (!session || session.userId !== userId || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    throw new HttpError(401, 'INVALID_SESSION', 'Your session is invalid. Please sign in again.')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  })
  if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.')
  return user
}

export const authenticate: RequestHandler = asyncHandler(async (request, _response, next) => {
  const token = bearerToken(request.header('authorization'))
  if (!token) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.')
  request.authUser = await loadUser(token)
  next()
})

export const optionalAuthenticate: RequestHandler = asyncHandler(async (request, _response, next) => {
  const token = bearerToken(request.header('authorization'))
  if (token) {
    try {
      request.authUser = await loadUser(token)
    } catch {
      request.authUser = undefined
    }
  }
  next()
})

export const requireAdmin: RequestHandler = (request, _response, next) => {
  if (request.authUser?.role !== 'ADMIN') {
    next(new HttpError(403, 'FORBIDDEN', 'Admin access required.'))
    return
  }
  next()
}

export const requireCustomer: RequestHandler = (request, _response, next) => {
  if (request.authUser?.role !== 'CUSTOMER') {
    next(new HttpError(403, 'FORBIDDEN', 'Customer access required.'))
    return
  }
  next()
}
