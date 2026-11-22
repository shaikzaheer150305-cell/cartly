import { z } from 'zod'

const quantity = z.number().int().min(1, 'Quantity must be at least 1.').max(99, 'Quantity must be 99 or less.')

export const addCartItemSchema = z.object({
  productId: z.string().min(1, 'Choose a product.'),
  quantity,
})

export const updateCartItemSchema = z.object({
  quantity,
})

export const productIdParamSchema = z.object({
  productId: z.string().min(1),
})
