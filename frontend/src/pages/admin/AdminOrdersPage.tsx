import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { OrderItems } from '../../components/order/OrderItems'
import { OrderSummary } from '../../components/order/OrderSummary'
import { OrderTimeline } from '../../components/order/OrderTimeline'
import { useToast } from '../../context/ToastContext'
import { Alert, Badge, Button, ConfirmDialog, DataTable, EmptyState, Input, Modal, Pagination, Select, SkeletonRows, StatusBadge } from '../../components/ui'
import type { DataTableColumn } from '../../components/ui'
import { cn, formatDate, formatPrice, statusLabel } from '../../lib/utils'
import { ApiError, api, errorMessage } from '../../services/api'
import type { Order, OrderStatus } from '../../types'

const statuses: Array<OrderStatus | ''> = ['', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

export function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [customer, setCustomer] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin', 'orders', status, customer, page],
    queryFn: () => api.listAdminOrders({ status, customer, page, limit: 10 }),
  })
  const detailQuery = useQuery({
    queryKey: ['admin', 'order', selectedId],
    queryFn: () => api.getAdminOrder(selectedId as string),
    enabled: Boolean(selectedId),
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    await queryClient.invalidateQueries({ queryKey: ['admin', 'order', selectedId] })
    await queryClient.invalidateQueries({ queryKey: ['orders'] })
    await queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
  }

  const changeStatus = async (order: Order, next: OrderStatus) => {
    setActionLoading(true)
    setActionError(null)
    try {
      await api.updateOrderStatus(order.id, next)
      await refresh()
      showToast(`Order marked ${statusLabel(next)}.`)
    } catch (error) {
      setActionError(errorMessage(error))
      if (error instanceof ApiError && Array.isArray(error.details?.allowed)) {
        setActionError(`${errorMessage(error)} Allowed next: ${(error.details.allowed as OrderStatus[]).map(statusLabel).join(', ')}.`)
      }
      if (error instanceof ApiError && error.status === 409) await refresh()
      showToast('Order status could not be changed.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const detail = detailQuery.data

  const columns: DataTableColumn<Order>[] = [
    {
      id: 'order',
      header: 'Order',
      primary: true,
      render: (order) => (
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', ['PAID', 'PROCESSING', 'SHIPPED'].includes(order.status) ? 'bg-amber-500' : 'bg-slate-300')} title={['PAID', 'PROCESSING', 'SHIPPED'].includes(order.status) ? 'Needs attention' : 'Settled'} />
          <span className="font-semibold text-slate-900">{order.orderNumber}</span>
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      render: (order) => (
        <div>
          <p className="text-slate-800">{order.customer.name}</p>
          <p className="text-xs text-slate-500">{order.customer.email}</p>
        </div>
      ),
    },
    { id: 'date', header: 'Date', render: (order) => <span className="text-slate-500">{formatDate(order.createdAt)}</span> },
    { id: 'total', header: 'Total', render: (order) => <span className="font-semibold tabular-nums text-slate-900">{formatPrice(order.totalCents)}</span> },
    { id: 'status', header: 'Status', render: (order) => <StatusBadge status={order.status} /> },
    {
      id: 'action',
      header: 'Action',
      align: 'right',
      render: (order) => <Button variant="secondary" size="sm" onClick={() => { setActionError(null); setSelectedId(order.id) }}>Open</Button>,
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Orders</h1>
      <p className="mt-1 text-sm text-slate-500">Review purchases and move orders through the allowed states.</p>

      <div className="my-5 grid gap-3 sm:grid-cols-2">
        <Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value as OrderStatus | ''); setPage(1) }}>
          {statuses.map((option) => <option key={option} value={option}>{option ? statusLabel(option) : 'All statuses'}</option>)}
        </Select>
        <Input label="Customer" placeholder="Name or email…" value={customer} onChange={(event) => { setCustomer(event.target.value); setPage(1) }} />
      </div>

      {actionError && <Alert variant="error" title="Order action failed" className="mb-5">{actionError}</Alert>}

      {query.isLoading && <SkeletonRows rows={6} />}
      {query.isError && <Alert variant="error" title="Orders could not be loaded." action={<Button variant="secondary" onClick={() => query.refetch()}>Retry</Button>}>{errorMessage(query.error)}</Alert>}
      {query.data && query.data.items.length === 0 && <EmptyState title="No orders match" description="Adjust the filters to see more orders." />}

      {query.data && query.data.items.length > 0 && (
        <>
          <DataTable
            columns={columns}
            data={query.data.items}
            getRowKey={(order) => order.id}
            caption="Admin orders"
          />

          <div className="mt-6">
            <Pagination page={query.data.page} totalPages={query.data.totalPages} onChange={setPage} />
          </div>
        </>
      )}

      <Modal
        open={Boolean(selectedId)}
        title={detail ? `Order ${detail.orderNumber}` : 'Order detail'}
        description={detail ? `${detail.customer.name} · ${detail.customer.email}` : undefined}
        onClose={() => setSelectedId(null)}
        size="lg"
      >
        {detailQuery.isLoading && <SkeletonRows rows={4} />}
        {detailQuery.isError && <Alert variant="error" title="Order detail could not be loaded.">{errorMessage(detailQuery.error)}</Alert>}
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.status} />
              <Badge variant="neutral">{formatDate(detail.createdAt)}</Badge>
              <Badge variant="neutral">{detail.items.reduce((sum, item) => sum + item.quantity, 0)} items</Badge>
            </div>
            <OrderItems items={detail.items} />
            <div className="grid gap-5 lg:grid-cols-2">
              <OrderSummary
                subtotalCents={detail.subtotalCents}
                shippingCents={detail.shippingCents}
                taxCents={detail.taxCents}
                totalCents={detail.totalCents}
              />
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
                <div className="mt-4"><OrderTimeline events={detail.events} /></div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Order actions</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {transitions[detail.status].filter((next) => next !== 'CANCELLED').map((next) => (
                  <Button key={next} size="sm" isLoading={actionLoading} onClick={() => changeStatus(detail, next)}>
                    Mark as {statusLabel(next).toLowerCase()}
                  </Button>
                ))}
                {detail.status === 'PAID' && (
                  <Button size="sm" variant="danger" onClick={() => setCancelOpen(true)}>Cancel order</Button>
                )}
                {transitions[detail.status].length === 0 && (
                  <p className="text-sm text-slate-500">This order is terminal. No further actions are available.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this order?"
        description="Stock will be restored and a cancellation event will be recorded."
        confirmLabel="Cancel order"
        isLoading={actionLoading}
        onCancel={() => setCancelOpen(false)}
        onConfirm={async () => {
          if (!detail) return
          await changeStatus(detail, 'CANCELLED')
          setCancelOpen(false)
        }}
      />
    </div>
  )
}
