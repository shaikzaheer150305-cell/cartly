import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { products } from '../data/products'
import { ShopContext } from './ShopContextCore'
import type { CartLine } from './ShopContextCore'

const CART_KEY = 'cartly.demo.cart'
const WISHLIST_KEY = 'cartly.demo.wishlist'
function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') as T ?? fallback } catch { return fallback }
}
export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(() => read<CartLine[]>(CART_KEY, []))
  const [wishlist, setWishlist] = useState<string[]>(() => read<string[]>(WISHLIST_KEY, []))
  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)) }, [wishlist])

  const addToCart = useCallback((productId: string, quantity = 1, color = '', size = '') => {
    const product = products.find((item) => item.id === productId)
    if (!product || product.stock < 1) return
    const chosenColor = color || product.colors[0]?.name || ''
    const chosenSize = size || product.sizes?.[0] || ''
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId && item.color === chosenColor && item.size === chosenSize)
      if (existing) return current.map((item) => item === existing ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) } : item)
      return [...current, { productId, quantity: Math.min(product.stock, quantity), color: chosenColor, size: chosenSize }]
    })
  }, [])
  const updateQuantity = useCallback((productId: string, color: string, size: string, quantity: number) => {
    const product = products.find((item) => item.id === productId)
    if (!product) return
    setCart((current) => current.map((item) => item.productId === productId && item.color === color && item.size === size ? { ...item, quantity: Math.max(1, Math.min(product.stock, quantity)) } : item))
  }, [])
  const removeFromCart = useCallback((productId: string, color: string, size: string) => setCart((current) => current.filter((item) => !(item.productId === productId && item.color === color && item.size === size))), [])
  const toggleWishlist = useCallback((productId: string) => setWishlist((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]), [])
  const isWishlisted = useCallback((productId: string) => wishlist.includes(productId), [wishlist])
  const count = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + (products.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0)
  const value = useMemo(() => ({ cart, wishlist, count, subtotal, addToCart, updateQuantity, removeFromCart, toggleWishlist, isWishlisted, clearCart: () => setCart([]) }), [cart, wishlist, count, subtotal, addToCart, updateQuantity, removeFromCart, toggleWishlist, isWishlisted])
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

