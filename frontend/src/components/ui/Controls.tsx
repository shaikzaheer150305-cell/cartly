import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function QuantityStepper({ value, max, min = 1, onChange, disabled = false, compact = false }: {
  value: number
  max: number
  min?: number
  onChange: (value: number) => void
  disabled?: boolean
  compact?: boolean
}) {
  const safeMax = Math.max(min, max)
  const decrease = () => onChange(Math.max(min, value - 1))
  const increase = () => onChange(Math.min(safeMax, value + 1))

  return (
    <div className={cn('inline-flex items-center rounded-lg border border-slate-200 bg-white', compact && 'h-9')}>
      <button
        type="button"
        onClick={decrease}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="flex h-11 w-11 items-center justify-center rounded-l-lg text-lg font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums text-slate-900" aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={increase}
        disabled={disabled || value >= safeMax}
        aria-label="Increase quantity"
        title={value >= safeMax ? `Maximum available: ${safeMax}` : undefined}
        className="flex h-11 w-11 items-center justify-center rounded-r-lg text-lg font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}

export function PageHeader({ title, description, actions, breadcrumb }: {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumb?: ReactNode
}) {
  return (
    <div className="mb-6">
      {breadcrumb && <div className="mb-3 text-sm text-slate-500">{breadcrumb}</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
