import { Prisma } from '@prisma/client'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import type { CategoryInput } from './category.schemas.js'

export interface CategoryDto {
  id: string
  name: string
  slug: string
  description: string
  productCount: number
}

type CategoryRecord = NonNullable<Awaited<ReturnType<typeof prisma.category.findFirst>>>

function toDto(category: CategoryRecord & { _count: { products: number } }): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    productCount: category._count.products,
  }
}

function rethrowUnique(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : []
    const field = target.includes('slug') ? 'slug' : 'name'
    throw new HttpError(409, 'CONFLICT', 'That category name or slug is already in use.', {
      [field]: 'Already in use.',
    })
  }
  throw error
}

export async function listCategories(): Promise<CategoryDto[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
  return categories.map(toDto)
}

export async function createCategory(input: CategoryInput): Promise<CategoryDto> {
  try {
    const category = await prisma.category.create({
      data: input,
      include: { _count: { select: { products: true } } },
    })
    return toDto(category)
  } catch (error) {
    rethrowUnique(error)
  }
}

export async function updateCategory(id: string, input: CategoryInput): Promise<CategoryDto> {
  try {
    const category = await prisma.category.update({
      where: { id },
      data: input,
      include: { _count: { select: { products: true } } },
    })
    return toDto(category)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new HttpError(404, 'NOT_FOUND', 'Category not found.')
    }
    rethrowUnique(error)
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const productCount = await prisma.product.count({ where: { categoryId: id } })
  if (productCount > 0) {
    throw new HttpError(409, 'CATEGORY_IN_USE', `Category is used by ${productCount} products.`, {
      count: productCount,
    })
  }

  try {
    await prisma.category.delete({ where: { id } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new HttpError(404, 'NOT_FOUND', 'Category not found.')
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new HttpError(409, 'CATEGORY_IN_USE', 'Category is still referenced by a product.', { count: 1 })
    }
    throw error
  }
}
