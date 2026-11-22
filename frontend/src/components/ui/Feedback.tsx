import type { ReactNode } from 'react'
import { Button } from './Button'
import { cn } from '../../lib/utils'

type AlertVariant = 'success' | 'error' | 'info' | 'warning'

const alertStyles: Record<AlertVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
}

export function Alert({ variant = 'info', title, children, action, className }: {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex flex-col gap-2 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between', alertStyles[variant], className)}
    >
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-md bg-slate-200', className)} />
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="mt-4 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading rows">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  )
}

export function Pagination({ page, totalPages, onChange }: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      {pages.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-current={value === page ? 'page' : undefined}
          className={cn(
            'h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
            value === page ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          {value}
        </button>
      ))}
      <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </nav>
  )
}
