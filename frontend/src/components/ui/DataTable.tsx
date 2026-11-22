import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface DataTableColumn<T> {
  id: string
  header: ReactNode
  render: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  headerClassName?: string
  cellClassName?: string
  primary?: boolean
  hideOnMobile?: boolean
}

const alignmentClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function DataTable<T>({ columns, data, getRowKey, className, caption, emptyState }: {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  className?: string
  caption?: string
  emptyState?: ReactNode
}) {
  if (data.length === 0) return emptyState ?? null

  const primary = columns.find((column) => column.primary) ?? columns[0]
  const mobileColumns = columns.filter((column) => column !== primary && !column.hideOnMobile)

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white', className)}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className={cn('px-4 py-3 font-semibold', alignmentClasses[column.align ?? 'left'], column.headerClassName)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((row) => (
              <tr key={getRowKey(row)} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.id} className={cn('px-4 py-3 align-middle', alignmentClasses[column.align ?? 'left'], column.cellClassName)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-200 md:hidden">
        {data.map((row) => (
          <div key={getRowKey(row)} className="p-4">
            <div className="text-sm font-semibold text-slate-900">{primary.render(row)}</div>
            <div className="mt-3 space-y-2">
              {mobileColumns.map((column) => (
                <div key={column.id} className="flex items-start justify-between gap-3">
                  <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">{column.header}</span>
                  <div className={cn('min-w-0 text-right text-sm text-slate-700', column.cellClassName)}>
                    {column.render(row)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
