import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import type { User } from '../types'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stubFetch(user: User | null = null) {
  const session = user
    ? jsonResponse({ accessToken: 'test-access-token', user })
    : new Response('', { status: 401 })

  vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    if (url.includes('/auth/refresh')) return session.clone()
    if (url.includes('/auth/me') && method === 'PATCH') return jsonResponse(user)
    if (url.includes('/admin/stats')) return jsonResponse({ products: 12, activeProducts: 9, orders: 4, needsAttention: 2 })
    if (url.includes('/orders/admin')) return jsonResponse({ items: [], page: 1, limit: 5, total: 0, totalPages: 1 })
    if (url.includes('/categories')) return jsonResponse([])
    if (url.includes('/products')) {
      return jsonResponse({ items: [], page: 1, limit: 12, total: 0, totalPages: 1 })
    }
    return new Response('', { status: 404 })
  }))
}

beforeEach(() => {
  window.localStorage.clear()
  window.history.pushState({}, '', '/')
  stubFetch()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Cartly frontend', () => {
  it('renders the storefront home page', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: /Thoughtful gear for work/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse products' })).toBeInTheDocument()
  })

  it('redirects a guest from the cart to login with return intent', async () => {
    window.history.pushState({}, '', '/cart')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
    expect(window.location.search).toContain('redirect=')
  })

  it('blocks customers from the admin area', async () => {
    const customer: User = {
      id: 'u-customer',
      name: 'Avery Carter',
      email: 'customer@cartly.test',
      role: 'CUSTOMER',
    }
    window.localStorage.setItem('cartly.auth', JSON.stringify(customer))
    stubFetch(customer)
    window.history.pushState({}, '', '/admin')
    render(<App />)
    expect(await screen.findByText('You do not have access to this area')).toBeInTheDocument()
  })

  it('shows inline validation errors on an empty login form', async () => {
    window.history.pushState({}, '', '/login')
    render(<App />)
    const form = (await screen.findByRole('button', { name: 'Log in' })).closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)
    await waitFor(() => expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
  })

  it('renders the catalog error state when the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.includes('/auth/refresh')) return new Response('', { status: 401 })
      if (url.includes('/products')) return new Response('', { status: 500 })
      if (url.includes('/categories')) return jsonResponse([])
      return new Response('', { status: 404 })
    }))
    window.history.pushState({}, '', '/products')
    render(<App />)
    expect(await screen.findByText('Products could not be loaded.', {}, { timeout: 6000 })).toBeInTheDocument()
  })

  it('renders catalog empty and mobile filter controls', async () => {
    window.history.pushState({}, '', '/products')
    render(<App />)
    expect(await screen.findByText('No products found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument()
  })

  it('renders dashboard metrics from the backend API', async () => {
    const admin: User = {
      id: 'u-admin',
      name: 'Admin User',
      email: 'admin@cartly.test',
      role: 'ADMIN',
    }
    window.localStorage.setItem('cartly.auth', JSON.stringify(admin))
    stubFetch(admin)
    window.history.pushState({}, '', '/admin')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(await screen.findByText('9')).toBeInTheDocument()
    expect(await screen.findByText('4')).toBeInTheDocument()
    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(await screen.findByText('No orders yet')).toBeInTheDocument()
  })

  it('updates a profile through the backend API and shows a success message', async () => {
    const customer: User = {
      id: 'u-customer',
      name: 'Avery Carter',
      email: 'customer@cartly.test',
      role: 'CUSTOMER',
    }
    window.localStorage.setItem('cartly.auth', JSON.stringify(customer))
    stubFetch(customer)
    window.history.pushState({}, '', '/profile')
    render(<App />)
    const form = (await screen.findByRole('button', { name: 'Save profile' })).closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)
    await waitFor(() => expect(screen.getByText('Profile updated.')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({ method: 'PATCH' }),
    )
  })
})
