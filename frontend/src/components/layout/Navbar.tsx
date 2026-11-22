import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CartIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../icons'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'
import { useShop } from '../../context/useShop'
import { products } from '../../data/products'
import { ProductImage } from '../product/ProductImage'
import { money } from '../../lib/store'
import { useToast } from '../../context/ToastContext'
import { Brand } from './Brand'

export function Navbar() {
  const { cart, count, subtotal, updateQuantity, removeFromCart, wishlist } = useShop()
  const [term, setTerm] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate(term.trim() ? `/products?q=${encodeURIComponent(term.trim())}` : '/products')
    setTerm('')
  }
  const categories = ['Clothing', 'Accessories', 'Shoes']
  const drawerItems = cart.map((line) => ({ line, product: products.find((item) => item.id === line.productId) })).filter((item) => item.product)
  const closeCart = () => setCartOpen(false)

  return (
    <>
      <div className="bg-[#243b2b] px-4 py-2 text-center text-[11px] font-medium tracking-[0.12em] text-white sm:text-xs">COMPLIMENTARY SHIPPING ON ORDERS OVER ₹2,000 <span className="mx-2 text-white/50">·</span> MADE FOR YOUR EVERYDAY</div>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center gap-4 px-4 sm:px-7 lg:px-10">
          <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 md:hidden">{menuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}</button>
          <Brand />
          <nav className="ml-6 hidden items-center gap-7 md:flex" aria-label="Shop categories">
            {categories.map((category) => <Link key={category} to={`/products?category=${category.toLowerCase()}`} className="text-[13px] font-medium text-slate-700 transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{category}</Link>)}
          </nav>
          <form onSubmit={submitSearch} role="search" className="ml-auto hidden w-full max-w-[300px] items-center rounded-full border border-slate-200 bg-[#fafaf9] px-4 transition focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/20 sm:flex">
            <SearchIcon className="h-4 w-4 shrink-0 text-slate-500" />
            <label className="sr-only" htmlFor="header-search">Search products</label><input id="header-search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search the collection" className="h-10 min-w-0 flex-1 bg-transparent pl-2 text-xs text-slate-900 outline-none placeholder:text-slate-400" />
          </form>
          <div className="ml-auto flex items-center gap-1 sm:ml-3 sm:gap-2">
            <button type="button" aria-label="Account information" onClick={() => setAccountOpen(true)} className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:flex"><UserIcon className="h-5 w-5" /></button>
            <Link to="/wishlist" aria-label={`Wishlist, ${wishlist.length} saved items`} className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><HeartIcon className="h-5 w-5" />{wishlist.length > 0 && <span className="absolute right-0 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-emerald-700 px-1 text-[9px] font-bold text-white">{wishlist.length}</span>}</Link>
            <button type="button" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${count} items`} className="relative flex h-10 items-center gap-2 rounded-full px-2 text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><CartIcon className="h-5 w-5" /><span className="hidden text-xs font-medium sm:inline">Bag</span><span className="flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-semibold text-white">{count}</span></button>
          </div>
        </div>
        {menuOpen && <div className="border-t border-slate-200 bg-white p-4 shadow-lg md:hidden"><form onSubmit={submitSearch} role="search" className="mb-3 flex items-center rounded-full border border-slate-200 px-3"><SearchIcon className="h-4 w-4 text-slate-500" /><label className="sr-only" htmlFor="mobile-header-search">Search products</label><input id="mobile-header-search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search the collection" className="h-11 w-full bg-transparent pl-2 text-sm outline-none" /></form><nav className="grid gap-1" aria-label="Mobile shop categories">{categories.map((category) => <Link onClick={() => setMenuOpen(false)} key={category} to={`/products?category=${category.toLowerCase()}`} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50">{category}</Link>)}<Link onClick={() => setMenuOpen(false)} to="/products" className="rounded-lg px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50">Shop all</Link></nav></div>}
      </header>

      <Drawer open={cartOpen} onClose={closeCart} title={`Your bag${count ? ` (${count})` : ''}`} footer={drawerItems.length ? <div><div className="mb-4 flex items-center justify-between text-sm"><span className="text-slate-600">Subtotal</span><span className="font-semibold text-slate-900">{money(subtotal)}</span></div><p className="mb-4 text-xs text-slate-500">Shipping and taxes calculated at checkout.</p><Button fullWidth size="lg" onClick={() => { closeCart(); navigate('/cart') }}>View bag & checkout</Button></div> : undefined}>
        {drawerItems.length ? <div className="space-y-5">{drawerItems.map(({ line, product }) => product && <div key={`${line.productId}-${line.color}-${line.size}`} className="flex gap-4"><Link onClick={closeCart} to={`/products/${product.slug}`} className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100"><ProductImage src={product.image} alt={product.name} className="h-full w-full object-cover" /></Link><div className="min-w-0 flex-1"><Link onClick={closeCart} to={`/products/${product.slug}`} className="text-sm font-semibold text-slate-900 hover:text-emerald-800">{product.name}</Link><p className="mt-1 text-xs text-slate-500">{line.color}{line.size ? ` · ${line.size}` : ''}</p><p className="mt-1 text-sm text-slate-700">{money(product.price)}</p><div className="mt-2 flex items-center justify-between"><div className="flex items-center rounded-full border border-slate-200"><button type="button" aria-label={`Decrease ${product.name} quantity`} disabled={line.quantity <= 1} onClick={() => updateQuantity(line.productId, line.color, line.size, line.quantity - 1)} className="h-7 w-8 text-slate-600 hover:text-emerald-800 disabled:text-slate-300">−</button><span className="w-5 text-center text-xs">{line.quantity}</span><button type="button" aria-label={`Increase ${product.name} quantity`} disabled={line.quantity >= product.stock} onClick={() => updateQuantity(line.productId, line.color, line.size, line.quantity + 1)} className="h-7 w-8 text-slate-600 hover:text-emerald-800 disabled:text-slate-300">+</button></div><button type="button" onClick={() => { removeFromCart(line.productId, line.color, line.size); showToast('Item removed from your bag.') }} className="text-xs text-slate-500 underline underline-offset-2 hover:text-rose-700">Remove</button></div></div></div>)}</div> : <div className="flex h-full flex-col items-center justify-center text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f1ed]"><CartIcon className="h-7 w-7 text-slate-600" /></span><h3 className="mt-5 text-lg font-semibold">Your bag is taking a little break</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Find something you love and it will be waiting here.</p><Button className="mt-5" onClick={() => { closeCart(); navigate('/products') }}>Explore the collection</Button></div>}
      </Drawer>
      <Drawer open={accountOpen} onClose={() => setAccountOpen(false)} title="Welcome to Cartly"><div className="rounded-2xl bg-[#f6f5f1] p-5"><p className="text-sm leading-6 text-slate-700">This is a demo storefront. You can shop, save favorites, and check out without creating an account.</p><Button className="mt-5" onClick={() => { setAccountOpen(false); navigate('/products') }}>Explore products</Button></div></Drawer>
    </>
  )
}
