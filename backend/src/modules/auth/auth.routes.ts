import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { authenticate } from '../../middleware/auth.js'
import { loginSchema, registerSchema, updateProfileSchema } from './auth.schemas.js'
import { getAuthenticatedUser, login, logout, refresh, register, updateName } from './auth.service.js'
import { REFRESH_COOKIE } from './session.js'

const router = Router()

function refreshTokenFrom(request: { cookies?: unknown }): string | undefined {
  const cookies = request.cookies as Record<string, string | undefined> | undefined
  return cookies?.[REFRESH_COOKIE]
}

router.post('/register', asyncHandler(async (request, response) => {
  const result = await register(registerSchema.parse(request.body), response)
  response.status(201).json(result)
}))

router.post('/login', asyncHandler(async (request, response) => {
  const result = await login(loginSchema.parse(request.body), response)
  response.json(result)
}))

router.post('/admin/login', asyncHandler(async (request, response) => {
  const result = await login(loginSchema.parse(request.body), response, 'ADMIN')
  response.json(result)
}))

router.post('/refresh', asyncHandler(async (request, response) => {
  const result = await refresh(refreshTokenFrom(request), response)
  response.json(result)
}))

router.post('/logout', asyncHandler(async (request, response) => {
  await logout(refreshTokenFrom(request), response)
  response.status(204).end()
}))

router.get('/me', authenticate, asyncHandler(async (request, response) => {
  const user = await getAuthenticatedUser(request.authUser!.id)
  response.json(user)
}))

router.patch('/me', authenticate, asyncHandler(async (request, response) => {
  const user = await updateName(request.authUser!.id, updateProfileSchema.parse(request.body))
  response.json(user)
}))

export default router
