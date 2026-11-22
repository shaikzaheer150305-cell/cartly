import type { ComponentType, SVGProps } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { BoxIcon, ChartIcon, ClipboardIcon, TagIcon } from '../icons'
import { Brand } from './Brand'

export interface AdminSidebarItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  end?: boolean
}

const defaultItems: AdminSidebarItem[] = [
  { to: '/admin', label: 'Dashboard', icon: ChartIcon, end: true },
  { to: '/admin/products', label: 'Products', icon: BoxIcon },
  { to: '/admin/categories', label: 'Categories', icon: TagIcon },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardIcon },
]

export function AdminSidebar({ items = defaultItems, onNavigate, className }: {
  items?: AdminSidebarItem[]
  onNavigate?: () => void
  className?: string
}) {
  return (
    <nav className={cn('flex h-full flex-col bg-slate-900 px-3 py-5 text-slate-300', className)} aria-label="Admin navigation">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Brand to="/admin" compact light ariaLabel="Cartly admin home" className="focus-visible:ring-indigo-400" />
        <div>
          <p className="text-sm font-bold text-white">Cartly</p>
          <p className="text-xs text-slate-400">Admin console</p>
        </div>
      </div>
      <ul className="space-y-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                isActive ? 'bg-indigo-600/15 text-white ring-1 ring-inset ring-indigo-500/40' : 'hover:bg-slate-800 hover:text-white',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mt-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-400">
        Changes to catalog and orders are visible to customers immediately.
      </div>
    </nav>
  )
}
