import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { authenticate, requireAdmin, requireCustomer } from '../../middleware/auth.js'
import { checkoutRateLimit } from '../../middleware/rateLimit.js'
import {
  checkoutSchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  statusBodySchema,
} from './order.schemas.js'
import {
  cancelOwnOrder,
  getAdminOrder,
  getOwnOrder,
  listAdminOrders,
  listOrders,
  placeOrder,
  updateOrderStatus,
} from './orders.service.js'

const router = Router()

router.get('/admin', authenticate, requireAdmin, asyncHandler(async (request, response) => {
  const query = listOrdersQuerySchema.parse(request.query)
  response.json(await listAdminOrders(query))
}))

router.get('/admin/:id', authenticate, requireAdmin, asyncHandler(async (request, response) => {
  const { id } = orderIdParamSchema.parse(request.params)
  response.json(await getAdminOrder(id))
}))

router.post('/', checkoutRateLimit, authenticate, requireCustomer, asyncHandler(async (request, response) => {
  const input = checkoutSchema.parse(request.body)
  response.status(201).json(await placeOrder(request.authUser!.id, input))
}))

router.get('/', authenticate, requireCustomer, asyncHandler(async (request, response) => {
  const query = listOrdersQuerySchema.parse(request.query)
  response.json(await listOrders(request.authUser!.id, query))
}))

router.get('/:id', authenticate, requireCustomer, asyncHandler(async (request, response) => {
  const { id } = orderIdParamSchema.parse(request.params)
  response.json(await getOwnOrder(request.authUser!.id, id))
}))

router.post('/:id/cancel', authenticate, requireCustomer, asyncHandler(async (request, response) => {
  const { id } = orderIdParamSchema.parse(request.params)
  response.json(await cancelOwnOrder(request.authUser!.id, id))
}))

router.patch('/:id/status', authenticate, requireAdmin, asyncHandler(async (request, response) => {
  const { id } = orderIdParamSchema.parse(request.params)
  const { status } = statusBodySchema.parse(request.body)
  response.json(await updateOrderStatus(id, { status }, request.authUser!.id))
}))

export default router
