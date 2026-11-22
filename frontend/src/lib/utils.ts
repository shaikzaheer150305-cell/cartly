export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function safeRedirect(value: string | null, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return `${prefix}_${random}`
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function rupeesToCents(value: string | number): number {
  const amount = typeof value === 'number' ? value : Number.parseFloat(value)
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * 100)
}

export function centsToRupees(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function productStatus(product: { isActive: boolean; deletedAt: string | null }): 'ACTIVE' | 'INACTIVE' | 'DELETED' {
  if (product.deletedAt) return 'DELETED'
  if (!product.isActive) return 'INACTIVE'
  return 'ACTIVE'
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: 'Pending',
    PAID: 'Confirmed',
  }
  if (labels[status]) return labels[status]
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
