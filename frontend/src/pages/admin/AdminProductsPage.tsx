import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CategoryFilter } from '../../components/product/CategoryFilter'
import { ProductImage } from '../../components/product/ProductImage'
import { PencilIcon, TrashIcon } from '../../components/icons'
import { Alert, Badge, Button, ConfirmDialog, DataTable, EmptyState, Input, Pagination, Price, ProductStatusBadge, Select, SkeletonRows } from '../../components/ui'
import type { DataTableColumn } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { productStatus } from '../../lib/utils'
import { api, errorMessage } from '../../services/api'
import type { Product, ProductStatus } from '../../types'

export function AdminProductsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProductStatus | ''>('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: api.listCategories })
  const query = useQuery({
    queryKey: ['admin', 'products', search, status, category, page],
    queryFn: () => api.listProducts({ q: search || undefined, status: status || 'ALL', category: category || undefined, page, limit: 10 }),
  })

  const columns: DataTableColumn<Product>[] = [
    {
      id: 'product',
      header: 'Product',
      primary: true,
      render: (product) => (
        <div className="flex items-center gap-3">
          <ProductImage src={product.images[0]} alt={product.name} className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{product.name}</p>
            <p className="text-xs text-slate-500">{categoriesQuery.data?.find((entry) => entry.id === product.categoryId)?.name ?? 'Uncategorised'}</p>
          </div>
        </div>
      ),
    },
    { id: 'sku', header: 'SKU', render: (product) => <span className="text-slate-500">{product.sku || '—'}</span> },
    { id: 'price', header: 'Price', render: (product) => <Price cents={product.priceCents} /> },
    {
      id: 'stock',
      header: 'Stock',
      hideOnMobile: true,
      render: (product) => <Badge variant={product.stock === 0 ? 'rose' : product.stock <= 5 ? 'amber' : 'neutral'}>{product.stock === 0 ? 'Out' : product.stock <= 5 ? `Low · ${product.stock}` : product.stock}</Badge>,
    },
    { id: 'status', header: 'Status', render: (product) => <ProductStatusBadge status={productStatus(product)} /> },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      render: (product) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" aria-label={`Edit ${product.name}`} onClick={() => navigate(`/admin/products/${product.id}/edit`)}><PencilIcon className="h-4 w-4" /> Edit</Button>
          <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" aria-label={`Delete ${product.name}`} disabled={Boolean(product.deletedAt)} onClick={() => setDeleting(product)}><TrashIcon className="h-4 w-4" /> Delete</Button>
        </div>
      ),
    },
  ]

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    setActionError(null)
    try {
      await api.deleteProduct(deleting.id)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      setDeleting(null)
      showToast('Product deleted.')
    } catch (error) {
      setActionError(errorMessage(error))
      showToast('Product could not be deleted.', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Create, edit and soft-delete catalog items.</p>
        </div>
        <Button onClick={() => navigate('/admin/products/new')}>Add product</Button>
      </div>

      {actionError && <Alert variant="error" title="Action failed" className="mb-5">{actionError}</Alert>}
      {categoriesQuery.isError && (
        <Alert variant="error" title="Categories could not be loaded." className="mb-5" action={<Button variant="secondary" onClick={() => categoriesQuery.refetch()}>Retry</Button>}>
          {errorMessage(categoriesQuery.error)}
        </Alert>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Input label="Search" placeholder="Search by name…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
        <Select label="Status" value={status} onChange={(event) => { setStatus(event.target.value as ProductStatus | ''); setPage(1) }}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DELETED">Deleted</option>
        </Select>
        <CategoryFilter
          categories={categoriesQuery.data ?? []}
          value={category}
          onChange={(value) => { setCategory(value); setPage(1) }}
        />
      </div>

      {query.isLoading && <SkeletonRows rows={6} />}
      {query.isError && <Alert variant="error" title="Products could not be loaded." action={<Button variant="secondary" onClick={() => query.refetch()}>Retry</Button>}>{errorMessage(query.error)}</Alert>}
      {query.data && query.data.items.length === 0 && (
        <EmptyState title="No products match" description="Adjust the filters or add a new product." actionLabel="Add product" onAction={() => navigate('/admin/products/new')} />
      )}

      {query.data && query.data.items.length > 0 && (
        <>
          <DataTable
            columns={columns}
            data={query.data.items}
            getRowKey={(product) => product.id}
            caption="Products"
          />

          <div className="mt-6">
            <Pagination page={query.data.page} totalPages={query.data.totalPages} onChange={setPage} />
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this product?"
        description="This hides the product from the store. Existing orders keep their records."
        confirmLabel="Delete product"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        isLoading={deleteLoading}
      />
    </div>
  )
}
