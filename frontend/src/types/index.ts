export type Role = 'CUSTOMER' | 'ADMIN'

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export type ActorType = 'SYSTEM' | 'CUSTOMER' | 'ADMIN'

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED'

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  productCount: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  priceCents: number
  stock: number
  sku: string
  categoryId: string
  images: string[]
  isActive: boolean
  deletedAt: string | null
  createdAt: string
}

export interface ProductInput {
  name: string
  slug: string
  description: string
  priceCents: number
  stock: number
  sku: string
  categoryId: string
  images: string[]
  isActive: boolean
}

export interface CategoryInput {
  name: string
  slug: string
  description: string
}

export interface CartItem {
  productId: string
  name: string
  slug: string
  image: string
  unitPriceCents: number
  quantity: number
  maxQuantity: number
  available: boolean
}

export interface Cart {
  items: CartItem[]
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  freeShippingThresholdCents: number | null
}

export interface Address {
  fullName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface OrderEvent {
  id: string
  status: OrderStatus
  actorType: ActorType
  timestamp: string
  note: string
}

export interface OrderItem {
  productId: string
  name: string
  slug: string
  image: string
  unitPriceCents: number
  quantity: number
  lineTotalCents: number
  available: boolean
}

export interface Order {
  id: string
  orderNumber: string
  createdAt: string
  status: OrderStatus
  customer: {
    name: string
    email: string
  }
  items: OrderItem[]
  address: Address
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  events: OrderEvent[]
}

export interface PageResult<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdminStats {
  products: number
  activeProducts: number
  orders: number
  needsAttention: number
}

export interface ProductQuery {
  q?: string
  category?: string
  status?: ProductStatus | 'ALL'
  minPriceCents?: number
  maxPriceCents?: number
  sort?: ProductSort
  page?: number
  limit?: number
}

export interface OrderQuery {
  status?: OrderStatus | ''
  customer?: string
  page?: number
  limit?: number
}

export interface ShippingSettings {
  flatFeeCents: number
  freeAboveCents: number | null
  isActive: boolean
}

export interface TaxSettings {
  percentBps: number
  isActive: boolean
}
