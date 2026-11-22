import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { api } from '../services/api'
import type { Cart } from '../types'
import { useAuth } from './AuthContext'

interface CartContextValue {
  cart: Cart | null
  count: number
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  addItem: (productId: string, quantity: number) => Promise<void>
  updateItem: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isCustomer } = useAuth()
  const queryClient = useQueryClient()
  const userId = isCustomer ? user?.id : undefined

  const query = useQuery({
    queryKey: ['cart', userId],
    queryFn: () => api.getCart(),
    enabled: Boolean(userId),
    staleTime: 0,
  })

  const setCart = useCallback(async (cart: Cart) => {
    if (!userId) return
    queryClient.setQueryData(['cart', userId], cart)
  }, [queryClient, userId])

  const refresh = useCallback(async () => {
    if (!userId) return
    await queryClient.invalidateQueries({ queryKey: ['cart', userId] })
  }, [queryClient, userId])

  const addItem = useCallback(async (productId: string, quantity: number) => {
    if (!userId) return
    await setCart(await api.addToCart(productId, quantity))
  }, [setCart, userId])

  const updateItem = useCallback(async (productId: string, quantity: number) => {
    if (!userId) return
    await setCart(await api.updateCartItem(productId, quantity))
  }, [setCart, userId])

  const removeItem = useCallback(async (productId: string) => {
    if (!userId) return
    await setCart(await api.removeCartItem(productId))
  }, [setCart, userId])

  const value = useMemo<CartContextValue>(() => ({
    cart: query.data ?? null,
    count: query.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh,
    addItem,
    updateItem,
    removeItem,
  }), [query.data, query.isLoading, query.error, refresh, addItem, updateItem, removeItem])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
