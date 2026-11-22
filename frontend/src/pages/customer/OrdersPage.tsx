import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, DataTable, EmptyState, Pagination, Select, SkeletonRows, StatusBadge } from '../../components/ui'
import type { DataTableColumn } from '../../components/ui'
import { formatDate, formatPrice, statusLabel } from '../../lib/utils'
import { api, errorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import type { Order, OrderStatus } from '../../types'

const statuses: Array<OrderStatus | ''> = ['', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export function OrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['orders', user?.id, status, page],
    queryFn: () => api.listOrders({ status, page, limit: 10 }),
    enabled: Boolean(user),
  })

  const columns: DataTableColumn<Order>[] = [
    { id: 'order', header: 'Order', primary: true, render: (order) => <span className="font-semibold text-slate-900">{order.orderNumber}</span> },
    { id: 'date', header: 'Date', render: (order) => <span className="text-slate-500">{formatDate(order.createdAt)}</span> },
    { id: 'items', header: 'Items', render: (order) => <span className="text-slate-600">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span> },
    { id: 'total', header: 'Total', render: (order) => <span className="font-semibold tabular-nums text-slate-900">{formatPrice(order.totalCents)}</span> },
    { id: 'status', header: 'Status', render: (order) => <StatusBadge status={order.status} /> },
    { id: 'action', header: 'Details', align: 'right', render: (order) => <Link to={`/orders/${order.id}`} className="font-semibold text-indigo-600 hover:text-indigo-700">View</Link> },
  ]

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My orders</h1>
      <p className="mb-6 text-sm text-slate-500">Review your past purchases and track their status.</p>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{query.data ? `${query.data.total} orders` : 'Loading…'}</p>
        <div className="w-48">
          <Select aria-label="Filter orders by status" value={status} onChange={(event) => { setStatus(event.target.value as OrderStatus | ''); setPage(1) }}>
            {statuses.map((option) => (
              <option key={option} value={option}>{option ? statusLabel(option) : 'All statuses'}</option>
            ))}
          </Select>
        </div>
      </div>

      {query.isLoading && <SkeletonRows rows={5} />}
      {query.isError && (
        <Alert variant="error" title="Orders could not be loaded." action={<Button variant="secondary" onClick={() => query.refetch()}>Retry</Button>}>
          {errorMessage(query.error)}
        </Alert>
      )}
      {query.data && query.data.items.length === 0 && (
        <EmptyState
          title="No orders yet"
          description="Once you place an order it will appear here."
          actionLabel="Browse products"
          onAction={() => navigate('/products')}
        />
      )}

      {query.data && query.data.items.length > 0 && (
        <>
          <DataTable
            columns={columns}
            data={query.data.items}
            getRowKey={(order) => order.id}
            caption="My orders"
          />

          <div className="mt-6">
            <Pagination page={query.data.page} totalPages={query.data.totalPages} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
