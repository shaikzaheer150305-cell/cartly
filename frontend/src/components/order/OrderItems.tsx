import type { OrderItem } from '../../types'
import { formatPrice } from '../../lib/utils'
import { ProductImage } from '../product/ProductImage'
import { Badge } from '../ui'

export function OrderItems({ items }: { items: OrderItem[] }) {
  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {items.map((item) => (
        <li key={item.productId} className="flex gap-4 p-4">
          <ProductImage src={item.image} alt={item.name} className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
              {!item.available && <Badge variant="neutral">No longer available</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Qty {item.quantity} · {formatPrice(item.unitPriceCents)} each</p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{formatPrice(item.lineTotalCents)}</p>
        </li>
      ))}
    </ul>
  )
}
