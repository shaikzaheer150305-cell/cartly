import type { ReactNode } from 'react'
import { Price } from '../ui'

export function OrderSummary({ subtotalCents, shippingCents, taxCents, totalCents, action, note }: {
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  action?: ReactNode
  note?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <dt>Subtotal</dt>
          <dd><Price cents={subtotalCents} /></dd>
        </div>
        <div className="flex justify-between text-slate-600">
          <dt>Shipping</dt>
          <dd><Price cents={shippingCents} /></dd>
        </div>
        <div className="flex justify-between text-slate-600">
          <dt>Estimated tax</dt>
          <dd><Price cents={taxCents} /></dd>
        </div>
      </dl>
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm font-semibold text-slate-900">Total</span>
        <Price cents={totalCents} size="lg" />
      </div>
      {note && <p className="mt-3 text-xs text-slate-500">{note}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
