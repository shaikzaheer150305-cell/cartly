import { Select } from '../ui/Fields'
import type { Category } from '../../types'

export function CategoryFilter({ categories, value, onChange, label = 'Category', allLabel = 'All categories', id, className, error, disabled = false }: {
  categories: Category[]
  value: string
  onChange: (value: string) => void
  label?: string
  allLabel?: string
  id?: string
  className?: string
  error?: string
  disabled?: boolean
}) {
  return (
    <Select
      id={id}
      label={label}
      error={error}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
    >
      <option value="">{allLabel}</option>
      {categories.map((category) => (
        <option key={category.id} value={category.slug}>{category.name}</option>
      ))}
    </Select>
  )
}
