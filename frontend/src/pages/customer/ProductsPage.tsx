import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilterIcon, SearchIcon } from '../../components/icons'
import { ProductGrid } from '../../components/product/ProductGrid'
import { Drawer } from '../../components/ui/Drawer'
import { Button } from '../../components/ui/Button'
import { categories, products } from '../../data/products'

function Filters({ params, setParam, clear }: { params: URLSearchParams; setParam: (key: string, value: string) => void; clear: () => void }) {
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', '6', '7', '8', '9', '10', '11']
  const colors = [...new Map(products.flatMap((product) => product.colors).map((color) => [color.name, color])).values()]
  const section = 'border-b border-slate-200 py-5'
  return <div>
    <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Filters</h2><button type="button" onClick={clear} className="text-xs font-semibold text-emerald-800 underline underline-offset-2">Clear all</button></div>
    <fieldset className={section}><legend className="text-xs font-semibold uppercase tracking-[0.1em]">Category</legend><div className="mt-3 space-y-2.5">{categories.map((category) => <label key={category.slug} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700"><input type="checkbox" checked={params.get('category') === category.slug} onChange={() => setParam('category', params.get('category') === category.slug ? '' : category.slug)} className="h-4 w-4 rounded border-slate-300 accent-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-700" />{category.name}<span className="ml-auto text-xs text-slate-400">{products.filter((item) => item.categorySlug === category.slug).length}</span></label>)}</div></fieldset>
    <fieldset className={section}><legend className="text-xs font-semibold uppercase tracking-[0.1em]">Price range</legend><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-[10px] text-slate-500">From<input type="number" min="0" value={params.get('min') ?? ''} onChange={(event) => setParam('min', event.target.value)} placeholder="₹ 0" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20" /></label><label className="text-[10px] text-slate-500">To<input type="number" min="0" value={params.get('max') ?? ''} onChange={(event) => setParam('max', event.target.value)} placeholder="No max" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20" /></label></div></fieldset>
    <fieldset className={section}><legend className="text-xs font-semibold uppercase tracking-[0.1em]">Size</legend><div className="mt-3 flex flex-wrap gap-2">{sizeOptions.map((size) => <button type="button" key={size} aria-pressed={params.get('size') === size} onClick={() => setParam('size', params.get('size') === size ? '' : size)} className={`min-w-9 rounded-lg border px-2.5 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${params.get('size') === size ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-500'}`}>{size}</button>)}</div></fieldset>
    <fieldset className="py-5"><legend className="text-xs font-semibold uppercase tracking-[0.1em]">Color</legend><div className="mt-3 grid grid-cols-2 gap-2">{colors.map((color) => <label key={color.name} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={params.get('color') === color.name} onChange={() => setParam('color', params.get('color') === color.name ? '' : color.name)} className="sr-only" /><span className={`h-5 w-5 rounded-full border ${params.get('color') === color.name ? 'ring-2 ring-emerald-800 ring-offset-2' : 'border-black/10'}`} style={{ backgroundColor: color.value }} /><span>{color.name}</span></label>)}</div></fieldset>
  </div>
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const setParam = (key: string, value: string) => {
    if (key === 'q') setSearch(value)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }
  const clear = () => { setSearch(''); setSearchParams(new URLSearchParams()) }
  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setParam('q', search.trim()) }
  const visibleProducts = useMemo(() => {
    const q = (searchParams.get('q') ?? '').trim().toLowerCase()
    const category = searchParams.get('category')
    const min = Number(searchParams.get('min') || 0)
    const max = Number(searchParams.get('max') || Infinity)
    const size = searchParams.get('size')
    const color = searchParams.get('color')
    const matching = products.filter((product) => (!q || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(q)) && (!category || product.categorySlug === category) && product.price >= min && product.price <= max && (!size || product.sizes?.includes(size)) && (!color || product.colors.some((option) => option.name === color)))
    const sort = searchParams.get('sort') ?? 'featured'
    return [...matching].sort((a, b) => sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : b.reviews - a.reviews)
  }, [searchParams])
  const chips = ['category', 'min', 'max', 'size', 'color', 'q'].filter((key) => searchParams.has(key))
  const labelFor = (key: string) => key === 'category' ? categories.find((category) => category.slug === searchParams.get(key))?.name ?? searchParams.get(key) : key === 'min' ? `From ₹${searchParams.get(key)}` : key === 'max' ? `Under ₹${searchParams.get(key)}` : key === 'q' ? `Search: ${searchParams.get(key)}` : searchParams.get(key)
  return <div>
    <div className="mb-8 border-b border-slate-200 pb-7"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800">A considered collection</p><h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">Shop all</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Things to wear, carry, and keep close. Find a new favorite among thoughtful everyday pieces.</p><form onSubmit={submitSearch} role="search" className="mt-5 flex max-w-lg items-center rounded-full border border-slate-200 bg-white px-4 focus-within:border-emerald-800 focus-within:ring-2 focus-within:ring-emerald-800/20"><SearchIcon className="h-4 w-4 text-slate-500"/><label className="sr-only" htmlFor="shop-search">Search products</label><input id="shop-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product name or category" className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"/><button className="text-xs font-semibold text-emerald-900">Search</button></form></div>
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]"><aside className="hidden lg:block"><div className="sticky top-28 rounded-2xl border border-slate-200 bg-white px-4"><Filters params={searchParams} setParam={setParam} clear={clear}/></div></aside><section aria-label="Product results"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><button type="button" onClick={() => setFilterOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 px-4 text-xs font-semibold lg:hidden"><FilterIcon className="h-4 w-4"/>Filters{chips.length > 0 ? ` (${chips.length})` : ''}</button><p aria-live="polite" className="text-xs text-slate-600"><span className="font-semibold text-slate-900">{visibleProducts.length}</span> pieces</p></div><label className="flex items-center gap-2 text-xs text-slate-500">Sort by<select aria-label="Sort products" value={searchParams.get('sort') ?? 'featured'} onChange={(event) => setParam('sort', event.target.value)} className="h-10 rounded-full border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div>
      {chips.length > 0 && <div className="mb-5 flex flex-wrap items-center gap-2">{chips.map((key) => <button key={key} type="button" onClick={() => setParam(key, '')} className="rounded-full bg-[#f1f2ed] px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{labelFor(key)} <span aria-hidden="true" className="ml-1">×</span></button>)}<button type="button" onClick={clear} className="px-2 py-2 text-[11px] font-semibold text-slate-600 underline underline-offset-2">Clear all</button></div>}
      {visibleProducts.length ? <ProductGrid products={visibleProducts}/> : <div className="rounded-2xl border border-dashed border-slate-300 bg-[#fafaf9] px-6 py-16 text-center"><p className="text-lg font-semibold text-slate-900">No pieces found</p><p className="mt-2 text-sm text-slate-500">Try another search or clear a filter to see more of the collection.</p><Button className="mt-5" onClick={clear}>Clear filters</Button></div>}
    </section></div>
    <Drawer open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter the collection" footer={<div className="flex gap-3"><Button variant="secondary" fullWidth onClick={clear}>Clear all</Button><Button fullWidth onClick={() => setFilterOpen(false)}>Show {visibleProducts.length} pieces</Button></div>}><Filters params={searchParams} setParam={setParam} clear={clear}/></Drawer>
  </div>
}
