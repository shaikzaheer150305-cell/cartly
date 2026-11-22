import { ApiError, clearToken, refreshSession, request, setToken } from './http'
import type { SessionResponse } from './http'
import type {
  Address,
  AdminStats,
  Category,
  CategoryInput,
  Cart,
  Order,
  OrderQuery,
  OrderStatus,
  PageResult,
  Product,
  ProductInput,
  ProductQuery,
  User,
} from '../types'

export { ApiError } from './http'

function productQueryString(query: ProductQuery = {}): string {
  const params = new URLSearchParams()
  const append = (key: string, value: string | number | undefined | null) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  append('q', query.q)
  append('category', query.category)
  append('status', query.status)
  append('minPriceCents', query.minPriceCents)
  append('maxPriceCents', query.maxPriceCents)
  append('sort', query.sort)
  append('page', query.page)
  append('limit', query.limit)
  const encoded = params.toString()
  return encoded ? `?${encoded}` : ''
}

export const api = {
  async login(email: string, password: string): Promise<User> {
    const result = await request<SessionResponse<User>>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    setToken(result.accessToken)
    return result.user
  },

  async register(input: { name: string; email: string; password: string }): Promise<User> {
    const result = await request<SessionResponse<User>>('/auth/register', {
      method: 'POST',
      body: input,
    })
    setToken(result.accessToken)
    return result.user
  },

  async refresh(): Promise<User> {
    const session = await refreshSession()
    if (!session) throw new ApiError(401, 'UNAUTHENTICATED', 'Please sign in to continue.')
    return session.user as User
  },

  async logout(): Promise<void> {
    try {
      await request<void>('/auth/logout', { method: 'POST' })
    } finally {
      clearToken()
    }
  },

  async updateProfile(name: string): Promise<User> {
    return request<User>('/auth/me', {
      method: 'PATCH',
      body: { name },
    })
  },

  async listCategories(): Promise<Category[]> {
    return request<Category[]>('/categories')
  },

  async createCategory(input: CategoryInput): Promise<Category> {
    return request<Category>('/categories', {
      method: 'POST',
      body: input,
    })
  },

  async updateCategory(id: string, input: CategoryInput): Promise<Category> {
    return request<Category>(`/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    })
  },

  async deleteCategory(id: string): Promise<void> {
    await request<void>(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },

  async listProducts(query: ProductQuery = {}): Promise<PageResult<Product>> {
    return request<PageResult<Product>>(`/products${productQueryString(query)}`)
  },

  async getProductBySlug(slug: string): Promise<Product> {
    return request<Product>(`/products/slug/${encodeURIComponent(slug)}`)
  },

  async getAdminProductById(id: string): Promise<Product> {
    return request<Product>(`/products/${encodeURIComponent(id)}`)
  },

  async createProduct(input: ProductInput): Promise<Product> {
    return request<Product>('/products', {
      method: 'POST',
      body: input,
    })
  },

  async updateProduct(id: string, input: ProductInput): Promise<Product> {
    return request<Product>(`/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: input,
    })
  },

  async deleteProduct(id: string): Promise<void> {
    await request<Product>(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },

  async getCart(): Promise<Cart> {
    return request<Cart>('/cart')
  },

  async addToCart(productId: string, quantity: number): Promise<Cart> {
    return request<Cart>('/cart/items', {
      method: 'POST',
      body: { productId, quantity },
    })
  },

  async updateCartItem(productId: string, quantity: number): Promise<Cart> {
    return request<Cart>(`/cart/items/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      body: { quantity },
    })
  },

  async removeCartItem(productId: string): Promise<Cart> {
    return request<Cart>(`/cart/items/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    })
  },

  async checkout(address: Address, idempotencyKey: string): Promise<Order> {
    return request<Order>('/orders', {
      method: 'POST',
      body: { address, idempotencyKey },
    })
  },

  async listOrders(query: OrderQuery = {}): Promise<PageResult<Order>> {
    const params = new URLSearchParams()
    if (query.status) params.set('status', query.status)
    if (query.page) params.set('page', String(query.page))
    if (query.limit) params.set('limit', String(query.limit))
    const encoded = params.toString()
    return request<PageResult<Order>>(`/orders${encoded ? `?${encoded}` : ''}`)
  },

  async getOrder(id: string): Promise<Order> {
    return request<Order>(`/orders/${encodeURIComponent(id)}`)
  },

  async cancelOrder(id: string): Promise<Order> {
    return request<Order>(`/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' })
  },

  async listAdminOrders(query: OrderQuery = {}): Promise<PageResult<Order>> {
    const params = new URLSearchParams()
    if (query.status) params.set('status', query.status)
    if (query.customer) params.set('customer', query.customer)
    if (query.page) params.set('page', String(query.page))
    if (query.limit) params.set('limit', String(query.limit))
    const encoded = params.toString()
    return request<PageResult<Order>>(`/orders/admin${encoded ? `?${encoded}` : ''}`)
  },

  async getAdminOrder(id: string): Promise<Order> {
    return request<Order>(`/orders/admin/${encodeURIComponent(id)}`)
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return request<Order>(`/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: { status },
    })
  },

  async getAdminStats(): Promise<AdminStats> {
    return request<AdminStats>('/admin/stats')
  },
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
