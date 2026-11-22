export interface PricingConfig {
  shippingFlatCents: number
  freeShippingThresholdCents: number | null
  shippingIsActive: boolean
  taxPercentBps: number
  taxIsActive: boolean
}

function envInteger(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return fallback
  const value = Number(raw)
  if (!Number.isInteger(value) || value < min || value > max) return fallback
  return value
}

function envBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return fallback
  const normalized = raw.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return fallback
}

function envShippingThreshold(): number | null {
  const raw = process.env.FREE_SHIPPING_THRESHOLD_CENTS
  if (raw === undefined) return 499900
  const normalized = raw.trim().toLowerCase()
  if (!normalized || normalized === 'null' || normalized === 'none') return null
  const value = Number(normalized)
  if (!Number.isInteger(value) || value < 0) return 499900
  return value
}

export function pricingConfig(): PricingConfig {
  return {
    shippingFlatCents: envInteger('SHIPPING_FLAT_FEE_CENTS', 4900, 0, 100000000),
    freeShippingThresholdCents: envShippingThreshold(),
    shippingIsActive: envBoolean('SHIPPING_IS_ACTIVE', true),
    taxPercentBps: envInteger('TAX_PERCENT_BPS', 0, 0, 10000),
    taxIsActive: envBoolean('TAX_IS_ACTIVE', false),
  }
}

export function calculateCartTotals(items: Array<{ unitPriceCents: number; quantity: number }>) {
  const config = pricingConfig()
  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0)
  const shippingCents =
    config.shippingIsActive &&
    (config.freeShippingThresholdCents === null || subtotalCents < config.freeShippingThresholdCents)
      ? config.shippingFlatCents
      : 0
  const taxCents = config.taxIsActive ? Math.round((subtotalCents * config.taxPercentBps) / 10000) : 0
  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
  }
}
