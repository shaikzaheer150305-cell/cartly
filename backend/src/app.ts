import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { isProduction, trustProxy, webOrigin } from './lib/env.js'
import { checkDatabaseConnection } from './lib/prisma.js'
import { asyncHandler } from './middleware/asyncHandler.js'
import { csrfProtection } from './middleware/csrf.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { authRateLimit } from './middleware/rateLimit.js'
import { requestId } from './middleware/requestId.js'
import adminRoutes from './modules/admin/admin.routes.js'
import authRoutes from './modules/auth/auth.routes.js'
import cartRoutes from './modules/cart/cart.routes.js'
import categoryRoutes from './modules/categories/categories.routes.js'
import orderRoutes from './modules/orders/orders.routes.js'
import productRoutes from './modules/products/products.routes.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', trustProxy())
  app.use(requestId)
  app.disable('x-powered-by')
  app.use(helmet({
    hsts: isProduction()
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  }))
  app.use(cors({
    origin: webOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())
  app.use(csrfProtection)

  app.get('/api/health', asyncHandler(async (_request, response) => {
    const connected = await checkDatabaseConnection()
    response.status(connected ? 200 : 503).json({
      status: connected ? 'ok' : 'degraded',
      service: 'cartly-backend',
      database: connected ? 'connected' : 'unavailable',
    })
  }))

  app.use('/api/admin', adminRoutes)
  app.use('/api/auth', authRateLimit, authRoutes)
  app.use('/api/cart', cartRoutes)
  app.use('/api/categories', categoryRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/products', productRoutes)

  app.use('/api', notFoundHandler)
  app.use(errorHandler)

  return app
}
