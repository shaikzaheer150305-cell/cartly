import { Input } from '../ui'
import { CategoryFilter } from './CategoryFilter'
import type { Category } from '../../types'

export interface CatalogFilters {
  category: string
  minPrice: string
  maxPrice: string
}

export function FilterPanel({ categories, values, onChange, onClear }: {
  categories: Category[]
  values: CatalogFilters
  onChange: (patch: Partial<CatalogFilters>) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
        <button type="button" onClick={onClear} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
          Clear all
        </button>
      </div>
      <CategoryFilter
        categories={categories}
        value={values.category}
        onChange={(category) => onChange({ category })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Min price"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={values.minPrice}
          onChange={(event) => onChange({ minPrice: event.target.value })}
        />
        <Input
          label="Max price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Any"
          value={values.maxPrice}
          onChange={(event) => onChange({ maxPrice: event.target.value })}
        />
      </div>
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Prices are in Indian rupees. Filters update the shareable URL.
      </p>
    </div>
  )
}
