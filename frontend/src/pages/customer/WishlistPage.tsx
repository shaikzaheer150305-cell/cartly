import { Link } from 'react-router-dom'
import { ProductGrid } from '../../components/product/ProductGrid'
import { Button } from '../../components/ui/Button'
import { useShop } from '../../context/useShop'
import { products } from '../../data/products'

export function WishlistPage() {
  const { wishlist } = useShop()
  const saved = products.filter((product) => wishlist.includes(product.id))
  return <div><div className="mb-8 border-b border-slate-200 pb-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800">Kept close</p><h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">Your wishlist</h1><p className="mt-2 text-sm text-slate-600">{saved.length ? `${saved.length} things you’ve had your eye on.` : 'A little space for the things you love.'}</p></div>{saved.length ? <ProductGrid products={saved}/> : <div className="mx-auto max-w-md py-14 text-center"><p className="text-lg font-semibold">Nothing saved just yet</p><p className="mt-2 text-sm text-slate-500">Tap the heart on a piece to keep it here for later.</p><Link to="/products" className="mt-5 inline-block"><Button>Explore the collection</Button></Link></div>}</div>
}
