import { Link } from 'react-router-dom'
import { CartIcon } from '../icons'
import { cn } from '../../lib/utils'

export function Brand({ to = '/', compact = false, light = false, className, ariaLabel = 'Cartly home' }: {
  to?: string
  compact?: boolean
  light?: boolean
  className?: string
  ariaLabel?: string
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700',
        light && 'focus-visible:ring-emerald-400',
        className,
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-sm">
        <CartIcon className="h-5 w-5" />
      </span>
      {!compact && (
        <span className={cn('text-lg font-bold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
          Cartly
        </span>
      )}
    </Link>
  )
}
