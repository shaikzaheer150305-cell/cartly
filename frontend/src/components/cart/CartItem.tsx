import { Link } from 'react-router-dom'
import type { CartItem as CartItemData } from '../../types'
import { cn, formatPrice } from '../../lib/utils'
import { ProductImage } from '../product/ProductImage'
import { Button, QuantityStepper } from '../ui'

export function CartItem({ item, onQuantityChange, onRemove, disabled = false, className }: {
  item: CartItemData
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center', className)}>
      <Link to={`/products/${item.slug}`} className="shrink-0">
        <ProductImage src={item.image} alt={item.name} className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/products/${item.slug}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-700">
          {item.name}
        </Link>
        <p className="mt-1 text-xs text-slate-500">{formatPrice(item.unitPriceCents)} each · {item.maxQuantity} available</p>
        {!item.available && (
          <p className="mt-2 text-xs font-medium text-red-600">This item is no longer available. Remove it to continue.</p>
        )}
        {item.available && item.quantity >= item.maxQuantity && (
          <p className="mt-2 text-xs font-medium text-amber-600">Maximum available quantity reached.</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <QuantityStepper
          value={item.quantity}
          max={item.maxQuantity}
          onChange={onQuantityChange}
          disabled={disabled || !item.available}
          compact
        />
        <p className="w-20 text-right text-sm font-semibold tabular-nums text-slate-900">
          {formatPrice(item.unitPriceCents * item.quantity)}
        </p>
        <Button variant="ghost" size="sm" disabled={disabled} onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  )
}
