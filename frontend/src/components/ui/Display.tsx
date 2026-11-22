import type { ReactNode } from 'react'
import { cn, formatPrice, statusLabel } from '../../lib/utils'
import type { OrderStatus, ProductStatus } from '../../types'

type BadgeVariant = 'neutral' | 'indigo' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet'

const badgeStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
}

export function Badge({ variant = 'neutral', children, className }: {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', badgeStyles[variant], className)}>
      {children}
    </span>
  )
}

const orderStatusStyles: Record<OrderStatus, BadgeVariant> = {
  PENDING_PAYMENT: 'amber',
  PAID: 'sky',
  PROCESSING: 'indigo',
  SHIPPED: 'violet',
  DELIVERED: 'emerald',
  CANCELLED: 'rose',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={orderStatusStyles[status]}>{statusLabel(status)}</Badge>
}

const productStatusStyles: Record<ProductStatus, BadgeVariant> = {
  ACTIVE: 'emerald',
  INACTIVE: 'amber',
  DELETED: 'rose',
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge variant={productStatusStyles[status]}>{statusLabel(status)}</Badge>
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="rose">Sold out</Badge>
  if (stock <= 5) return <Badge variant="amber">Low stock · {stock} left</Badge>
  return <Badge variant="emerald">In stock · {stock} available</Badge>
}

export function Price({ cents, className, size = 'md' }: {
  cents: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
  }
  return <span className={cn('font-semibold tabular-nums tracking-tight text-slate-900', sizes[size], className)}>{formatPrice(cents)}</span>
}
