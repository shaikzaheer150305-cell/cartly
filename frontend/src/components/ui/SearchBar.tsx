import type { FormEvent } from 'react'
import { Button } from './Button'
import { SearchIcon } from '../icons'
import { cn } from '../../lib/utils'

export function SearchBar({
  id,
  value,
  onChange,
  onSubmit,
  placeholder = 'Search…',
  label = 'Search',
  buttonLabel = 'Search',
  showButton = false,
  autoFocus = false,
  size = 'md',
  className,
  wrapperClassName,
  inputClassName,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  placeholder?: string
  label?: string
  buttonLabel?: string
  showButton?: boolean
  autoFocus?: boolean
  size?: 'sm' | 'md'
  className?: string
  wrapperClassName?: string
  inputClassName?: string
}) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', className)}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className={cn('flex w-full gap-2', showButton && 'flex-col sm:flex-row', wrapperClassName)}>
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={cn(
              'w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500',
              size === 'sm' ? 'h-10' : 'h-11',
              inputClassName,
            )}
          />
        </div>
        {showButton && (
          <Button type="submit" className={cn(size === 'sm' ? 'h-10' : 'h-11', 'shrink-0')}>
            {buttonLabel}
          </Button>
        )}
      </div>
    </form>
  )
}
