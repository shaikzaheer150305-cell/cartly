import { Prisma } from '@prisma/client'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { z } from 'zod'
import { isProduction } from '../lib/env.js'
import { HttpError } from '../lib/httpError.js'

function zodDetails(error: z.ZodError): Record<string, unknown> {
  const details: Record<string, unknown> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'request'
    details[field] = issue.message
  }
  return details
}

function errorCode(error: unknown): string {
  if (error instanceof HttpError) return error.code
  if (error instanceof z.ZodError) return 'VALIDATION_ERROR'
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code
  return 'INTERNAL_ERROR'
}

function logServerError(error: unknown, id: string | undefined): void {
  const base = {
    level: 'error',
    requestId: id ?? 'unknown',
    code: errorCode(error),
  }
  if (isProduction()) {
    console.error(JSON.stringify(base))
    return
  }
  console.error(JSON.stringify({
    ...base,
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  }))
}

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found.' })
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.status).json({
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    })
    return
  }

  if (error instanceof z.ZodError) {
    response.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Please check the submitted data.',
      details: zodDetails(error),
    })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : []
      const field = typeof target[0] === 'string' ? target[0] : 'value'
      response.status(409).json({
        code: 'CONFLICT',
        message: 'That value is already in use.',
        details: { [field]: 'Already in use.' },
      })
      return
    }
    if (error.code === 'P2003') {
      response.status(400).json({
        code: 'INVALID_REFERENCE',
        message: 'A referenced record does not exist.',
      })
      return
    }
    if (error.code === 'P2025') {
      response.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found.' })
      return
    }
  }

  const status = typeof (error as { status?: unknown })?.status === 'number'
    ? (error as { status: number }).status
    : 500
  if (status >= 400 && status < 500) {
    response.status(status).json({ code: 'BAD_REQUEST', message: 'The request could not be processed.' })
    return
  }

  logServerError(error, request.id)
  response.status(500).json({ code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' })
}
