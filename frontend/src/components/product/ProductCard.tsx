import { Link } from 'react-router-dom'
import { HeartIcon, StarIcon } from '../icons'
import type { StoreProduct } from '../../data/products'
import { money } from '../../lib/store'
import { useShop } from '../../context/useShop'
import { useToast } from '../../context/ToastContext'
import { ProductImage } from './ProductImage'

export function ProductCard({ product }: { product: StoreProduct }) {
  const { toggleWishlist, isWishlisted, addToCart } = useShop()
  const { showToast } = useToast()
  const wished = isWishlisted(product.id)
  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden rounded-2xl bg-[#f3f1ed]">
        <Link to={`/products/${product.slug}`} aria-label={`View ${product.name}`} className="block aspect-[4/5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700">
          <ProductImage src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
        </Link>
        {product.badge && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">{product.badge}</span>}
        <button type="button" aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} aria-pressed={wished} onClick={() => toggleWishlist(product.id)} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm transition hover:scale-105 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
          <HeartIcon className={`h-[18px] w-[18px] ${wished ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
        <button type="button" disabled={product.stock === 0} onClick={() => { addToCart(product.id); showToast(`${product.name} added to your bag.`) }} className="absolute inset-x-3 bottom-3 h-11 translate-y-2 rounded-full bg-white text-sm font-semibold text-slate-900 opacity-0 shadow-md transition duration-200 hover:bg-emerald-700 hover:text-white focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-70 max-sm:translate-y-0 max-sm:opacity-100">{product.stock ? 'Quick add' : 'Sold out'}</button>
      </div>
      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">{product.category}</p>
            <Link to={`/products/${product.slug}`} className="mt-1 inline-block text-sm font-semibold text-slate-900 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{product.name}</Link>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums text-slate-900">{money(product.price)}</p>
            <p className="text-xs text-slate-400 line-through">{money(product.compareAt)}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><StarIcon className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /><span className="font-medium text-slate-700">{product.rating}</span><span>({product.reviews})</span></div>
        <div className="mt-2 flex gap-1.5" aria-label={`Available colors: ${product.colors.map((color) => color.name).join(', ')}`}>
          {product.colors.slice(0, 4).map((color) => <span key={color.name} title={color.name} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: color.value }} />)}
        </div>
      </div>
    </article>
  )
}
