import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BoxIcon, ClipboardIcon, PlusIcon } from '../../components/icons'
import { Alert, Button, EmptyState, Skeleton, StatusBadge } from '../../components/ui'
import { formatDate, formatPrice } from '../../lib/utils'
import { api, errorMessage } from '../../services/api'

export function AdminDashboardPage() {
  const statsQuery = useQuery({ queryKey: ['admin', 'stats'], queryFn: api.getAdminStats })
  const ordersQuery = useQuery({ queryKey: ['admin', 'orders', 'recent'], queryFn: () => api.listAdminOrders({ limit: 5 }) })

  const cards = [
    { label: 'Total products', value: statsQuery.data?.products, tone: 'bg-indigo-50 text-indigo-700' },
    { label: 'Active products', value: statsQuery.data?.activeProducts, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total orders', value: statsQuery.data?.orders, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Needs attention', value: statsQuery.data?.needsAttention, tone: 'bg-amber-50 text-amber-700' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">A quick view of catalog health and order activity.</p>

      {statsQuery.isError && <Alert variant="error" title="Dashboard data could not be loaded." className="mt-5" action={<Button variant="secondary" onClick={() => statsQuery.refetch()}>Retry</Button>}>{errorMessage(statsQuery.error)}</Alert>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            {statsQuery.isLoading ? <Skeleton className="mt-3 h-9 w-16" /> : (
              <p className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-2xl font-bold tabular-nums ${card.tone}`}>{card.value ?? 0}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View all</Link>
          </div>
          <div className="mt-4 space-y-2">
            {ordersQuery.isLoading && <Skeleton className="h-16 w-full" />}
            {ordersQuery.isError && (
              <Alert variant="error" title="Recent orders could not be loaded." action={<Button variant="secondary" onClick={() => ordersQuery.refetch()}>Retry</Button>}>
                {errorMessage(ordersQuery.error)}
              </Alert>
            )}
            {ordersQuery.data?.items.length === 0 && <EmptyState title="No orders yet" description="New customer orders will appear here." />}
            {ordersQuery.data?.items.map((order) => (
              <Link key={order.id} to="/admin/orders" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50">
                <div>
                  <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">{formatDate(order.createdAt)} · {formatPrice(order.totalCents)}</p>
                </div>
                <StatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Shortcuts</h2>
          <div className="mt-4 space-y-2">
            <Link to="/admin/products/new" className="flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
              <PlusIcon className="h-5 w-5" /> Add product
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              <ClipboardIcon className="h-5 w-5" /> View orders
            </Link>
            <Link to="/admin/products" className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              <BoxIcon className="h-5 w-5" /> Manage products
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
