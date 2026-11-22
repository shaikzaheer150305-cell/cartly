import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function ErrorMessage({ children, id, className }: {
  children: ReactNode
  id?: string
  className?: string
}) {
  if (!children) return null
  return (
    <p id={id} role="alert" className={cn('text-xs font-medium text-rose-600', className)}>
      {children}
    </p>
  )
}
