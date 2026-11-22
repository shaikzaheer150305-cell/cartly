import { z } from 'zod'

const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.')
const imageUrl = z.string().trim().refine(
  (value) => /^https?:\/\//i.test(value) || /^data:image\//i.test(value),
  'Use an absolute http(s) image URL.',
)

export const productInputSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters.').max(140, 'Name is too long.'),
  slug,
  description: z.string().trim().min(10, 'Description must be at least 10 characters.'),
  priceCents: z.number().int().min(0, 'Price cannot be negative.').max(100000000, 'Price is too high.'),
  stock: z.number().int().min(0, 'Stock cannot be negative.').max(999, 'Stock must be 999 or less.'),
  sku: z.string().trim().max(64, 'SKU is too long.'),
  categoryId: z.string().min(1, 'Choose a category.'),
  images: z.array(imageUrl).min(1, 'Add at least one image.').max(8, 'Use at most 8 images.'),
  isActive: z.boolean(),
})

export const listProductsQuerySchema = z.object({
  q: z.string().trim().max(120, 'Search text is too long.').optional(),
  category: z.string().trim().max(180).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DELETED', 'ALL']).optional(),
  minPriceCents: z.coerce.number().int().min(0).optional(),
  maxPriceCents: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name_asc']).optional(),
  page: z.coerce.number().int().min(1).max(10000).optional(),
  limit: z.coerce.number().int().min(1).max(48).optional(),
})

export const idParamSchema = z.object({
  id: z.string().min(1),
})

export const slugParamSchema = z.object({
  slug: z.string().min(1),
})
