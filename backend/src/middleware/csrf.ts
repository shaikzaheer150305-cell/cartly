import type { RequestHandler } from 'express'
import { isProduction, webOrigin } from '../lib/env.js'
import { HttpError } from '../lib/httpError.js'

function isAllowedOrigin(value: string): boolean {
  try {
    return new URL(value).origin === new URL(webOrigin()).origin
  } catch {
    return false
  }
}

export const csrfProtection: RequestHandler = (request, _response, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    next()
    return
  }

  const origin = request.header('origin')
  const referer = request.header('referer')
  if ((origin && !isAllowedOrigin(origin)) || (!origin && referer && !isAllowedOrigin(referer))) {
    next(new HttpError(403, 'CSRF_REJECTED', 'Cross-origin requests are not allowed.'))
    return
  }

  next()
}
