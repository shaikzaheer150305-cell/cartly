import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Prisma } from '@prisma/client'
import type { Role } from '@prisma/client'
import type { Response } from 'express'
import { z } from 'zod'
import { jwtAccessSecret } from '../../lib/env.js'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import type { AuthenticatedUser } from '../../middleware/auth.js'
import { loginSchema, registerSchema, updateProfileSchema } from './auth.schemas.js'
import { clearRefreshCookie, generateRefreshToken, hashRefreshToken, refreshExpiry, setRefreshCookie } from './session.js'

const ACCESS_TTL_SECONDS = 15 * 60
const BCRYPT_COST = 12

export interface AuthResponse {
  accessToken: string
  user: AuthenticatedUser
}

function accessTokenFor(userId: string, sessionId: string): string {
  return jwt.sign({ sub: userId, sid: sessionId }, jwtAccessSecret(), { expiresIn: ACCESS_TTL_SECONDS })
}

function toAuthenticatedUser(user: AuthenticatedUser): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

async function issueSession(userId: string, response: Response): Promise<string> {
  const token = generateRefreshToken()
  const session = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(token),
      expiresAt: refreshExpiry(),
    },
    select: { id: true },
  })
  setRefreshCookie(response, token)
  return session.id
}

export async function register(input: z.infer<typeof registerSchema>, response: Response): Promise<AuthResponse> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST)
  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: 'CUSTOMER',
      },
      select: { id: true, name: true, email: true, role: true },
    })
    const sessionId = await issueSession(user.id, response)
    return {
      accessToken: accessTokenFor(user.id, sessionId),
      user: toAuthenticatedUser(user),
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'EMAIL_TAKEN', 'An account with that email already exists.', { email: 'Already in use.' })
    }
    throw error
  }
}

export async function login(
  input: z.infer<typeof loginSchema>,
  response: Response,
  requiredRole?: Role,
): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true, role: true, passwordHash: true },
  })
  const validPassword = user ? await bcrypt.compare(input.password, user.passwordHash) : false
  if (!user || !validPassword || (requiredRole && user.role !== requiredRole)) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
  }

  const sessionId = await issueSession(user.id, response)
  return {
    accessToken: accessTokenFor(user.id, sessionId),
    user: toAuthenticatedUser(user),
  }
}

export async function refresh(token: string | undefined, response: Response): Promise<AuthResponse> {
  if (!token) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.')

  const tokenHash = hashRefreshToken(token)
  const session = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  })

  if (!session) throw new HttpError(401, 'INVALID_SESSION', 'Your session is invalid. Please sign in again.')
  if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    await prisma.refreshToken.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    throw new HttpError(401, 'INVALID_SESSION', 'Your session is invalid. Please sign in again.')
  }

  const rotated = await prisma.$transaction(async (transaction) => {
    const revoked = await transaction.refreshToken.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    if (revoked.count !== 1) {
      await transaction.refreshToken.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      throw new HttpError(401, 'INVALID_SESSION', 'Your session is invalid. Please sign in again.')
    }
    const nextToken = generateRefreshToken()
    const nextSession = await transaction.refreshToken.create({
      data: {
        userId: session.userId,
        tokenHash: hashRefreshToken(nextToken),
        expiresAt: refreshExpiry(),
      },
      select: { id: true },
    })
    return { token: nextToken, sessionId: nextSession.id }
  })

  setRefreshCookie(response, rotated.token)
  return {
    accessToken: accessTokenFor(session.user.id, rotated.sessionId),
    user: toAuthenticatedUser(session.user),
  }
}

export async function logout(token: string | undefined, response: Response): Promise<void> {
  if (token) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
  clearRefreshCookie(response)
}

export async function getAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  })
  if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.')
  return toAuthenticatedUser(user)
}

export async function updateName(userId: string, input: z.infer<typeof updateProfileSchema>): Promise<AuthenticatedUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: input.name },
    select: { id: true, name: true, email: true, role: true },
  })
  return toAuthenticatedUser(user)
}
