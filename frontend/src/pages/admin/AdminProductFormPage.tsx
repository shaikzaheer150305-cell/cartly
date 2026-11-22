import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { TrashIcon } from '../../components/icons'
import { Alert, Button, Checkbox, Input, PageHeader, Select, Skeleton, Textarea } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { centsToRupees, rupeesToCents, slugify } from '../../lib/utils'
import { applyZodErrors } from '../../lib/form'
import { api, errorMessage } from '../../services/api'
import type { ProductInput } from '../../types'

const imageSchema = z.string().refine(
  (value) => /^https?:\/\//i.test(value) || /^data:image\//i.test(value),
  'Use an http(s) image URL.',
)

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.string().refine((value) => Number.parseFloat(value) >= 0, 'Enter a valid price.'),
  stock: z.string().regex(/^\d+$/, 'Enter a whole number.'),
  sku: z.string(),
  categoryId: z.string().min(1, 'Choose a category.'),
  images: z.array(z.object({ url: imageSchema })).min(1, 'Add at least one image.'),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '1',
  sku: '',
  categoryId: '',
  images: [{ url: '' }],
  isActive: true,
}

function toFormValues(product: Awaited<ReturnType<typeof api.getAdminProductById>>): FormValues {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: centsToRupees(product.priceCents),
    stock: String(product.stock),
    sku: product.sku,
    categoryId: product.categoryId,
    images: product.images.map((url) => ({ url })),
    isActive: product.isActive && !product.deletedAt,
  }
}

export function AdminProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(isEdit)

  const { register, control, handleSubmit, reset, setValue, watch, setError, formState: { errors, isDirty } } = useForm<FormValues>({
    defaultValues: emptyValues,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'images' })

  const productQuery = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => api.getAdminProductById(id as string),
    enabled: isEdit,
  })
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: api.listCategories })
  const name = watch('name')

  useEffect(() => {
    if (productQuery.data) {
      reset(toFormValues(productQuery.data))
      setSlugTouched(true)
    }
  }, [productQuery.data, reset])

  useEffect(() => {
    if (!isEdit && !slugTouched) setValue('slug', slugify(name))
  }, [isEdit, name, setValue, slugTouched])

  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    setSaving(true)
    try {
      const parsed = schema.parse(values)
      const input: ProductInput = {
        name: parsed.name.trim(),
        slug: parsed.slug,
        description: parsed.description.trim(),
        priceCents: rupeesToCents(parsed.price),
        stock: Number(parsed.stock),
        sku: parsed.sku.trim(),
        categoryId: parsed.categoryId,
        images: parsed.images.map((image) => image.url.trim()),
        isActive: parsed.isActive,
      }
      if (isEdit) await api.updateProduct(id as string, input)
      else await api.createProduct(input)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['product'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      navigate('/admin/products')
      showToast(isEdit ? 'Product updated.' : 'Product created.')
    } catch (error) {
      if (error instanceof z.ZodError) applyZodErrors(error, setError)
      else setSubmitError(errorMessage(error))
      showToast('Product could not be saved.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && productQuery.isLoading) return <Skeleton className="h-96 w-full" />
  if (isEdit && (productQuery.isError || !productQuery.data)) {
    return <Alert variant="error" title="Product could not be loaded." action={<Button variant="secondary" onClick={() => productQuery.refetch()}>Retry</Button>}>{errorMessage(productQuery.error)}</Alert>
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit product' : 'Add product'}
        description={isEdit ? 'Update catalog details and publish settings.' : 'Create a new item for the storefront.'}
        actions={<Button variant="secondary" onClick={() => navigate('/admin/products')}>Cancel</Button>}
      />

      {submitError && <Alert variant="error" title="Product could not be saved" className="mb-5">{submitError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]" noValidate>
        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" error={errors.name?.message} {...register('name')} />
            <Input label="Slug" error={errors.slug?.message} helperText="Generated from the name until you edit it." {...register('slug')} onBlur={() => setSlugTouched(true)} />
          </div>
          <Textarea label="Description" error={errors.description?.message} {...register('description')} />
          {categoriesQuery.isError && (
            <Alert variant="error" title="Categories could not be loaded." action={<Button variant="secondary" onClick={() => categoriesQuery.refetch()}>Retry</Button>}>
              {errorMessage(categoriesQuery.error)}
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Price (₹)" type="number" min="0" step="0.01" error={errors.price?.message} {...register('price')} />
            <Input label="Stock" type="number" min="0" step="1" error={errors.stock?.message} {...register('stock')} />
            <Input label="SKU (optional)" error={errors.sku?.message} {...register('sku')} />
            <Select label="Category" error={errors.categoryId?.message} {...register('categoryId')}>
              <option value="">Choose a category</option>
              {categoriesQuery.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Image URLs</p>
                <p className="text-xs text-slate-500">Use absolute http(s) or data image URLs.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => append({ url: '' })}>Add image</Button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      aria-label={`Image URL ${index + 1}`}
                      placeholder="https://…"
                      error={errors.images?.[index]?.url?.message}
                      {...register(`images.${index}.url`)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove image ${index + 1}`}
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {typeof errors.images?.message === 'string' && <p className="mt-2 text-xs font-medium text-rose-600">{errors.images.message}</p>}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Publish options</h2>
            <div className="mt-4">
              <Checkbox label="Active in storefront" {...register('isActive')} />
            </div>
            <p className="mt-3 text-xs text-slate-500">Inactive products remain available in admin and historical orders.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <Button type="submit" fullWidth isLoading={saving}>{isEdit ? 'Save changes' : 'Create product'}</Button>
            <Button type="button" variant="ghost" fullWidth className="mt-2" onClick={() => navigate('/admin/products')}>Cancel</Button>
          </div>
        </aside>
      </form>
    </div>
  )
}
