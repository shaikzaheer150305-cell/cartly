export const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
export const FREE_SHIPPING_THRESHOLD = 2000
export const STANDARD_SHIPPING = 99
