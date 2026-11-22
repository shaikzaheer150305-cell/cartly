import { OrderStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export interface AdminStatsDto {
  products: number
  activeProducts: number
  orders: number
  needsAttention: number
}

export async function getAdminStats(): Promise<AdminStatsDto> {
  const [products, activeProducts, orders, needsAttention] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
    prisma.order.count(),
    prisma.order.count({
      where: {
        status: {
          in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED],
        },
      },
    }),
  ])

  return { products, activeProducts, orders, needsAttention }
}
