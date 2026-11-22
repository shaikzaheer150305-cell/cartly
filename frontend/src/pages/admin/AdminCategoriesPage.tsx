import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PencilIcon, TrashIcon } from '../../components/icons'
import { Alert, Button, ConfirmDialog, DataTable, EmptyState, Input, Modal, SkeletonRows, Textarea } from '../../components/ui'
import type { DataTableColumn } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { applyZodErrors } from '../../lib/form'
import { api, ApiError, errorMessage } from '../../services/api'
import type { Category, CategoryInput } from '../../types'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.'),
  description: z.string(),
})

export function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<CategoryInput>()

  const query = useQuery({ queryKey: ['categories'], queryFn: api.listCategories })

  const openCreate = () => {
    setEditing(null)
    setActionError(null)
    reset({ name: '', slug: '', description: '' })
    setFormOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setActionError(null)
    reset({ name: category.name, slug: category.slug, description: category.description })
    setFormOpen(true)
  }

  const submit = async (values: CategoryInput) => {
    setSaving(true)
    setActionError(null)
    try {
      const parsed = schema.parse(values)
      const input = { ...parsed, name: parsed.name.trim(), description: parsed.description.trim() }
      if (editing) await api.updateCategory(editing.id, input)
      else await api.createCategory(input)
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      setFormOpen(false)
      showToast(editing ? 'Category updated.' : 'Category created.')
    } catch (error) {
      if (error instanceof z.ZodError) {
        applyZodErrors(error, setError)
      } else {
        if (error instanceof ApiError && error.details) {
          Object.entries(error.details).forEach(([field, value]) => {
            if (field === 'name' || field === 'slug' || field === 'description') {
              setError(field, { type: 'validate', message: typeof value === 'string' ? value : 'Invalid value.' })
            }
          })
        }
        setActionError(errorMessage(error))
        showToast('Category could not be saved.', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const columns: DataTableColumn<Category>[] = [
    {
      id: 'name',
      header: 'Name',
      primary: true,
      render: (category) => (
        <div>
          <p className="font-semibold text-slate-900">{category.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{category.description}</p>
        </div>
      ),
    },
    { id: 'slug', header: 'Slug', render: (category) => <span className="font-mono text-xs text-slate-500">{category.slug}</span> },
    { id: 'products', header: 'Products', render: (category) => <span className="tabular-nums text-slate-600">{category.productCount}</span> },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      render: (category) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(category)}><PencilIcon className="h-4 w-4" /> Edit</Button>
          <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => { setActionError(null); setDeleting(category) }}><TrashIcon className="h-4 w-4" /> Delete</Button>
        </div>
      ),
    },
  ]

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    setActionError(null)
    try {
      await api.deleteCategory(deleting.id)
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleting(null)
      showToast('Category deleted.')
    } catch (error) {
      setActionError(errorMessage(error))
      showToast('Category could not be deleted.', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">Organise the catalog into clear groups.</p>
        </div>
        <Button onClick={openCreate}>Add category</Button>
      </div>

      {actionError && <Alert variant="error" title="Action failed" className="mb-5">{actionError}</Alert>}

      {query.isLoading && <SkeletonRows rows={5} />}
      {query.isError && <Alert variant="error" title="Categories could not be loaded." action={<Button variant="secondary" onClick={() => query.refetch()}>Retry</Button>}>{errorMessage(query.error)}</Alert>}
      {query.data && query.data.length === 0 && <EmptyState title="No categories yet" description="Add your first category to organise products." actionLabel="Add category" onAction={openCreate} />}

      {query.data && query.data.length > 0 && (
        <DataTable
          columns={columns}
          data={query.data}
          getRowKey={(category) => category.id}
          caption="Categories"
        />
      )}

      <Modal
        open={formOpen}
        title={editing ? 'Edit category' : 'Add category'}
        onClose={() => setFormOpen(false)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" form="category-form" isLoading={saving}>{editing ? 'Save changes' : 'Create category'}</Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <Input label="Name" error={errors.name?.message} {...register('name')} />
          <Input label="Slug" error={errors.slug?.message} helperText="Lowercase letters, numbers and hyphens." {...register('slug')} />
          <Textarea label="Description" rows={3} {...register('description')} />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this category?"
        description="Deletion is refused while any product, including a soft-deleted one, still references it."
        confirmLabel="Delete category"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        isLoading={deleteLoading}
      />
    </div>
  )
}
