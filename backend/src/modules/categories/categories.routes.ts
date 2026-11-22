import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { authenticate, requireAdmin } from '../../middleware/auth.js'
import { categoryIdParamSchema, categoryInputSchema } from './category.schemas.js'
import { createCategory, deleteCategory, listCategories, updateCategory } from './categories.service.js'

const router = Router()

router.get('/', asyncHandler(async (_request, response) => {
  response.json(await listCategories())
}))

router.post('/', authenticate, requireAdmin, asyncHandler(async (request, response) => {
  const category = await createCategory(categoryInputSchema.parse(request.body))
  response.status(201).json(category)
}))

router.patch('/:id', authenticate, requireAdmin, asyncHandler(async (request, response) => {
  const { id } = categoryIdParamSchema.parse(request.params)
  const category = await updateCategory(id, categoryInputSchema.parse(request.body))
  response.json(category)
}))

router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (request, response) => {
  const { id } = categoryIdParamSchema.parse(request.params)
  await deleteCategory(id)
  response.status(204).end()
}))

export default router
