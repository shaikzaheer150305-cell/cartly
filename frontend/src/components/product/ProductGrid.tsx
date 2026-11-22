import type { ReactNode } from 'react'
import type { StoreProduct } from '../../data/products'
import { cn } from '../../lib/utils'
import { ProductCard } from './ProductCard'

type GridColumns = 'two' | 'three' | 'four' | 'responsive'

const columnClasses: Record<GridColumns, string> = {
  two: 'grid-cols-1 sm:grid-cols-2',
  three: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  four: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  responsive: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
}

export function ProductGrid({ products, columns = 'responsive', emptyState, className }: {
  products: StoreProduct[]
  columns?: GridColumns
  emptyState?: ReactNode
  className?: string
}) {
  if (products.length === 0) return emptyState ?? null

  return (
    <div className={cn('grid gap-4', columnClasses[columns], className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
