import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { authenticate, requireCustomer } from '../../middleware/auth.js'
import { addCartItemSchema, productIdParamSchema, updateCartItemSchema } from './cart.schemas.js'
import { addCartItem, getCart, removeCartItem, updateCartItemQuantity } from './cart.service.js'

const router = Router()

router.use(authenticate, requireCustomer)

router.get('/', asyncHandler(async (request, response) => {
  response.json(await getCart(request.authUser!.id))
}))

router.post('/items', asyncHandler(async (request, response) => {
  const input = addCartItemSchema.parse(request.body)
  response.json(await addCartItem(request.authUser!.id, input.productId, input.quantity))
}))

router.patch('/items/:productId', asyncHandler(async (request, response) => {
  const { productId } = productIdParamSchema.parse(request.params)
  const { quantity } = updateCartItemSchema.parse(request.body)
  response.json(await updateCartItemQuantity(request.authUser!.id, productId, quantity))
}))

router.delete('/items/:productId', asyncHandler(async (request, response) => {
  const { productId } = productIdParamSchema.parse(request.params)
  response.json(await removeCartItem(request.authUser!.id, productId))
}))

export default router
