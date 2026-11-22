import type { Product } from '../types'

type OfferDetails = {
  rating: number
  reviewCount: number
  discountPercent: number
  badge?: string
}

export type ProductOffer = OfferDetails & {
  originalPriceCents: number
}

const offers: Record<string, OfferDetails> = {
  'wireless-headphones': { rating: 4.4, reviewCount: 2841, discountPercent: 62, badge: 'Bestseller' },
  smartwatch: { rating: 4.3, reviewCount: 1964, discountPercent: 58, badge: 'Trending' },
  'bluetooth-speaker': { rating: 4.5, reviewCount: 1427, discountPercent: 44, badge: 'Top rated' },
  'nonstick-cookware': { rating: 4.4, reviewCount: 2185, discountPercent: 50, badge: 'Bestseller' },
  'coffee-maker': { rating: 4.5, reviewCount: 1128, discountPercent: 46 },
  'cotton-bedsheet': { rating: 4.3, reviewCount: 864, discountPercent: 52, badge: 'New' },
  novel: { rating: 4.7, reviewCount: 5231, discountPercent: 33, badge: 'Bestseller' },
  'the-bhagavad-gita': { rating: 4.8, reviewCount: 3412, discountPercent: 38 },
  'wings-of-fire': { rating: 4.6, reviewCount: 1987, discountPercent: 32 },
  'yoga-mat': { rating: 4.2, reviewCount: 936, discountPercent: 55, badge: 'Top rated' },
  'dumbbell-set': { rating: 4.3, reviewCount: 712, discountPercent: 50 },
  'skipping-rope': { rating: 4.1, reviewCount: 1284, discountPercent: 57 },
  'leather-wallet': { rating: 4.3, reviewCount: 1543, discountPercent: 56 },
  'titan-sunglasses': { rating: 4.4, reviewCount: 987, discountPercent: 46, badge: 'Trending' },
  'laptop-backpack': { rating: 4.2, reviewCount: 1319, discountPercent: 48 },
  'running-shoes': { rating: 4.3, reviewCount: 2673, discountPercent: 50, badge: 'Bestseller' },
  'roadster-tshirt': { rating: 4.2, reviewCount: 1841, discountPercent: 54 },
  'biba-kurta-set': { rating: 4.5, reviewCount: 1042, discountPercent: 53, badge: 'New' },
}

const defaultOffer: OfferDetails = {
  rating: 4.2,
  reviewCount: 120,
  discountPercent: 10,
}

export function getProductOffer(product: Product): ProductOffer {
  const details = offers[product.slug] ?? defaultOffer
  const originalPriceCents = Math.round(
    product.priceCents / (1 - details.discountPercent / 100) / 100,
  ) * 100

  return { ...details, originalPriceCents }
}

export function formatReviewCount(count: number): string {
  if (count < 1000) return `${count}`
  return `${(count / 1000).toFixed(1)}k`
}

export type CategoryVisual = {
  gradient: string
  glow: string
  icon: string
  description: string
}

const categoryVisuals: Record<string, CategoryVisual> = {
  electronics: {
    gradient: 'from-indigo-600 to-blue-500',
    glow: 'bg-indigo-200',
    icon: 'electronics',
    description: 'Audio, wearables and smart tech',
  },
  'home-kitchen': {
    gradient: 'from-amber-500 to-orange-600',
    glow: 'bg-amber-200',
    icon: 'home',
    description: 'Cook, serve and refresh your space',
  },
  books: {
    gradient: 'from-violet-600 to-fuchsia-500',
    glow: 'bg-violet-200',
    icon: 'books',
    description: 'Stories and ideas worth keeping',
  },
  fitness: {
    gradient: 'from-emerald-600 to-teal-500',
    glow: 'bg-emerald-200',
    icon: 'fitness',
    description: 'Move better, every single day',
  },
  accessories: {
    gradient: 'from-sky-600 to-cyan-500',
    glow: 'bg-sky-200',
    icon: 'accessories',
    description: 'Finishing touches for everyday carry',
  },
  fashion: {
    gradient: 'from-rose-500 to-pink-600',
    glow: 'bg-rose-200',
    icon: 'fashion',
    description: 'Comfortable style for every occasion',
  },
}

const defaultVisual: CategoryVisual = {
  gradient: 'from-slate-600 to-slate-800',
  glow: 'bg-slate-200',
  icon: 'default',
  description: 'Explore more from Cartly',
}

export function getCategoryVisual(slug?: string): CategoryVisual {
  if (!slug) return defaultVisual
  return categoryVisuals[slug] ?? defaultVisual
}
