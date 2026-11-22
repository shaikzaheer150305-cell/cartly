import { z } from 'zod'

const orderStatus = z.enum(['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the recipient name.').max(80),
  phone: z.string().trim().min(6, 'Enter a valid phone number.').max(40),
  line1: z.string().trim().min(3, 'Enter the street address.').max(140),
  line2: z.string().trim().max(140),
  city: z.string().trim().min(2, 'Enter the city.').max(80),
  state: z.string().trim().max(80),
  postalCode: z.string().trim().min(3, 'Enter the postal code.').max(20),
  country: z.string().trim().min(2, 'Enter the country.').max(80),
})

export const checkoutSchema = z.object({
  address: addressSchema,
  idempotencyKey: z.string().trim().min(8, 'Missing checkout key.').max(100),
})

export const orderIdParamSchema = z.object({
  id: z.string().min(1),
})

export const statusBodySchema = z.object({
  status: orderStatus,
})

export const listOrdersQuerySchema = z.object({
  status: orderStatus.optional(),
  customer: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(10000).optional(),
  limit: z.coerce.number().int().min(1).max(48).optional(),
})
