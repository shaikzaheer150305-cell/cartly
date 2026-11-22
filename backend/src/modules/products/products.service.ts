import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import { listProductsQuerySchema, productInputSchema } from './product.schemas.js'

type ProductRecord = NonNullable<Awaited<ReturnType<typeof prisma.product.findFirst>>>
type ProductInput = z.infer<typeof productInputSchema>
type ListQuery = z.infer<typeof listProductsQuerySchema> & { isAdmin: boolean }

export interface ProductDto {
  id: string
  name: string
  slug: string
  description: string
  priceCents: number
  stock: number
  sku: string
  categoryId: string
  images: string[]
  isActive: boolean
  deletedAt: string | null
  createdAt: string
}

export interface PageResult<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

function imagesFrom(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

function toProductDto(product: ProductRecord): ProductDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    priceCents: product.priceCents,
    stock: product.stock,
    sku: product.sku ?? '',
    categoryId: product.categoryId,
    images: imagesFrom(product.imageUrls),
    isActive: product.isActive,
    deletedAt: product.deletedAt ? product.deletedAt.toISOString() : null,
    createdAt: product.createdAt.toISOString(),
  }
}

function rethrowUnique(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target) ? error.meta.target : []
    const field = typeof target[0] === 'string' ? target[0] : 'value'
    throw new HttpError(409, 'CONFLICT', 'That value is already in use.', { [field]: 'Already in use.' })
  }
  throw error
}

async function assertCategory(categoryId: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  })
  if (!category) {
    throw new HttpError(400, 'INVALID_CATEGORY', 'Choose a valid category.', { categoryId: 'Category not found.' })
  }
}

export async function listProducts(query: ListQuery): Promise<PageResult<ProductDto>> {
  const page = query.page ?? 1
  const limit = query.limit ?? 12
  const status = query.status ?? 'ACTIVE'
  const where: Prisma.ProductWhereInput = {}

  if (!query.isAdmin || status !== 'ALL') {
    if (status === 'ACTIVE') {
      where.isActive = true
      where.deletedAt = null
    } else if (status === 'INACTIVE') {
      where.isActive = false
      where.deletedAt = null
    } else if (status === 'DELETED') {
      where.deletedAt = { not: null }
    }
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { sku: { contains: query.q, mode: 'insensitive' } },
    ]
  }

  if (query.category) {
    const category = await prisma.category.findFirst({
      where: { OR: [{ id: query.category }, { slug: query.category }] },
      select: { id: true },
    })
    if (!category) {
      return { items: [], page, limit, total: 0, totalPages: 1 }
    }
    where.categoryId = category.id
  }

  if (query.minPriceCents !== undefined || query.maxPriceCents !== undefined) {
    where.priceCents = {
      ...(query.minPriceCents !== undefined ? { gte: query.minPriceCents } : {}),
      ...(query.maxPriceCents !== undefined ? { lte: query.maxPriceCents } : {}),
    }
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
  if (query.sort === 'price_asc') orderBy = { priceCents: 'asc' }
  if (query.sort === 'price_desc') orderBy = { priceCents: 'desc' }
  if (query.sort === 'name_asc') orderBy = { name: 'asc' }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return {
    items: products.map(toProductDto),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export async function getProductById(id: string, isAdmin: boolean): Promise<ProductDto> {
  const where: Prisma.ProductWhereInput = { id }
  if (!isAdmin) {
    where.isActive = true
    where.deletedAt = null
  }
  const product = await prisma.product.findFirst({ where })
  if (!product) throw new HttpError(404, 'NOT_FOUND', 'Product not found.')
  return toProductDto(product)
}

export async function getProductBySlug(slug: string, isAdmin: boolean): Promise<ProductDto> {
  const where: Prisma.ProductWhereInput = { slug }
  if (!isAdmin) {
    where.isActive = true
    where.deletedAt = null
  }
  const product = await prisma.product.findFirst({ where })
  if (!product) throw new HttpError(404, 'NOT_FOUND', 'Product not found.')
  return toProductDto(product)
}

export async function createProduct(input: ProductInput): Promise<ProductDto> {
  await assertCategory(input.categoryId)
  const sku = input.sku || `CRT-${input.slug.toUpperCase().replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}`
  try {
    const product = await prisma.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        priceCents: input.priceCents,
        stock: input.stock,
        sku,
        categoryId: input.categoryId,
        imageUrls: input.images,
        isActive: input.isActive,
      },
    })
    return toProductDto(product)
  } catch (error) {
    rethrowUnique(error)
  }
}

export async function updateProduct(id: string, input: ProductInput): Promise<ProductDto> {
  await assertCategory(input.categoryId)
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, sku: true } })
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Product not found.')
  const sku = input.sku || existing.sku

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        priceCents: input.priceCents,
        stock: input.stock,
        sku,
        categoryId: input.categoryId,
        imageUrls: input.images,
        isActive: input.isActive,
      },
    })
    return toProductDto(product)
  } catch (error) {
    rethrowUnique(error)
  }
}

export async function deleteProduct(id: string): Promise<ProductDto> {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } })
  if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Product not found.')
  const product = await prisma.product.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() },
  })
  return toProductDto(product)
}
