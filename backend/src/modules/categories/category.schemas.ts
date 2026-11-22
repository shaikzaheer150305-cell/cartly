import { z } from 'zod'

const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.')

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80, 'Name is too long.'),
  slug: slug.max(120, 'Slug is too long.'),
  description: z.string().trim().max(2000, 'Description is too long.').default(''),
})

export const categoryIdParamSchema = z.object({
  id: z.string().min(1),
})

export type CategoryInput = z.infer<typeof categoryInputSchema>
