import { createContext } from 'react'

export type CartLine = { productId: string; quantity: number; color: string; size: string }
export type ShopState = {
  cart: CartLine[]
  wishlist: string[]
  count: number
  subtotal: number
  addToCart: (productId: string, quantity?: number, color?: string, size?: string) => void
  updateQuantity: (productId: string, color: string, size: string, quantity: number) => void
  removeFromCart: (productId: string, color: string, size: string) => void
  toggleWishlist: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  clearCart: () => void
}

export const ShopContext = createContext<ShopState | null>(null)
