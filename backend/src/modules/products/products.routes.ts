import { Router } from 'express'
import type { Request, Response } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { authenticate, optionalAuthenticate, requireAdmin } from '../../middleware/auth.js'
import { idParamSchema, listProductsQuerySchema, productInputSchema, slugParamSchema } from './product.schemas.js'
import { createProduct, deleteProduct, getProductById, getProductBySlug, listProducts, updateProduct } from './products.service.js'

const router = Router()

router.get('/', optionalAuthenticate, asyncHandler(async (request, response) => {
  const query = listProductsQuerySchema.parse(request.query)
  const result = await listProducts({ ...query, isAdmin: request.authUser?.role === 'ADMIN' })
  response.json(result)
}))

router.get('/slug/:slug', optionalAuthenticate, asyncHandler(async (request, response) => {
  const { slug } = slugParamSchema.parse(request.params)
  const product = await getProductBySlug(slug, request.authUser?.role === 'ADMIN')
  response.json(product)
}))

router.get('/:id', optionalAuthenticate, asyncHandler(async (request, response) => {
  const { id } = idParamSchema.parse(request.params)
  const product = await getProductById(id, request.authUser?.role === 'ADMIN')
  response.json(product)
}))

router.post('/', authenticate, requireAdmin, asyncHandler(async (request, response) => {
  const product = await createProduct(productInputSchema.parse(request.body))
  response.status(201).json(product)
}))

async function handleUpdate(request: Request, response: Response): Promise<void> {
  const { id } = idParamSchema.parse(request.params)
  const product = await updateProduct(id, productInputSchema.parse(request.body))
  response.json(product)
}

router.put('/:id', authenticate, requireAdmin, asyncHandler(handleUpdate))
router.patch('/:id', authenticate, requireAdmin, asyncHandler(handleUpdate))

router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (request, response) => {
  const { id } = idParamSchema.parse(request.params)
  const product = await deleteProduct(id)
  response.json(product)
}))

export default router
