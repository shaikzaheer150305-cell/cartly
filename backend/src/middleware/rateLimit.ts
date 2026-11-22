import { rateLimit } from 'express-rate-limit'
import { isProduction } from '../lib/env.js'

const sharedOptions = {
  windowMs: 60 * 1000,
  limit: isProduction() ? 10 : 1000,
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.',
  },
}

export const authRateLimit = rateLimit(sharedOptions)
export const checkoutRateLimit = rateLimit(sharedOptions)
