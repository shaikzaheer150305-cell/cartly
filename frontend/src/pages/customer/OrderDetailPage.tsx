import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { OrderItems } from '../../components/order/OrderItems'
import { OrderSummary } from '../../components/order/OrderSummary'
import { OrderTimeline } from '../../components/order/OrderTimeline'
import { Alert, Button, ConfirmDialog, Skeleton, StatusBadge } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../lib/utils'
import { api, errorMessage } from '../../services/api'

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id),
    enabled: Boolean(user),
  })

  const cancel = async () => {
    if (!user) return
    setCancelling(true)
    setActionError(null)
    try {
      await api.cancelOrder(id)
      await queryClient.invalidateQueries({ queryKey: ['order', id] })
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      setConfirmOpen(false)
      showToast('Order cancelled. Stock has been restored.')
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setCancelling(false)
    }
  }

  if (query.isLoading) return <Skeleton className="h-96 w-full" />
  if (query.isError || !query.data) {
    return <Alert variant="error" title="Order could not be loaded." action={<Button variant="secondary" onClick={() => query.refetch()}>Retry</Button>}>{errorMessage(query.error)}</Alert>
  }

  const order = query.data
  const canCancel = order.status === 'PAID'

  return (
    <div>
      <nav className="mb-5 text-sm text-slate-500">
        <Link to="/orders" className="hover:text-indigo-600">My orders</Link> <span className="mx-2">/</span> {order.orderNumber}
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          {canCancel && <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>Cancel order</Button>}
        </div>
      </div>

      {actionError && <Alert variant="error" title="Action failed" className="mt-5">{actionError}</Alert>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Items</h2>
            <OrderItems items={order.items} />
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">Shipping address</h2>
            <address className="mt-3 space-y-0.5 text-sm not-italic text-slate-600">
              <p className="font-semibold text-slate-900">{order.address.fullName}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>{order.address.city}{order.address.state ? `, ${order.address.state}` : ''} {order.address.postalCode}</p>
              <p>{order.address.country}</p>
              <p className="pt-1 text-xs text-slate-400">{order.address.phone}</p>
            </address>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Status timeline</h2>
            <OrderTimeline events={order.events} />
          </section>
        </div>
        <OrderSummary
          subtotalCents={order.subtotalCents}
          shippingCents={order.shippingCents}
          taxCents={order.taxCents}
          totalCents={order.totalCents}
          note="This is an immutable snapshot of the order total."
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this order?"
        description="Your stock will be restored and the cancellation will be added to the timeline. This cannot be undone."
        confirmLabel="Cancel order"
        onConfirm={cancel}
        onCancel={() => setConfirmOpen(false)}
        isLoading={cancelling}
      />
    </div>
  )
}
