import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'

declare global {
  namespace Express {
    interface Request {
      id?: string
    }
  }
}

export const requestId: RequestHandler = (request, response, next) => {
  const incoming = request.header('x-request-id')
  const id = incoming && /^[A-Za-z0-9._-]{1,64}$/.test(incoming) ? incoming : randomUUID()
  request.id = id
  response.setHeader('X-Request-Id', id)
  next()
}
