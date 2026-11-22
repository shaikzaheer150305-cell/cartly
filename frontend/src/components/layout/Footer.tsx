import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '../icons'
import { Brand } from './Brand'
import { useToast } from '../../context/ToastContext'

export function Footer() {
  const [email, setEmail] = useState('')
  const { showToast } = useToast()
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { showToast('Enter a valid email address.', 'error'); return }
    setEmail('')
    showToast('You’re on the list. Thanks for joining us!')
  }
  return (
    <footer className="mt-20 bg-[#f4f3ef]">
      <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-10 border-b border-slate-300/70 pb-12 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800">A little note from Cartly</p><h2 className="mt-3 max-w-lg text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-900 sm:text-4xl">Good things, delivered to your inbox.</h2><p className="mt-3 text-sm text-slate-600">New arrivals, thoughtful finds, and the occasional lovely surprise.</p></div>
          <form onSubmit={submit} className="flex gap-2" noValidate><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="Your email address" className="h-12 min-w-0 flex-1 border-b border-slate-400 bg-transparent px-1 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-700" /><button type="submit" className="inline-flex h-12 items-center gap-2 px-3 text-sm font-semibold text-emerald-900 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">Sign me up <ArrowRightIcon className="h-4 w-4" /></button></form>
        </div>
        <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div><Brand /><p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">Thoughtful things for the everyday. Made to be reached for, worn in, and loved for a long time.</p></div>
          <div><h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-800">Explore</h3><nav className="mt-4 flex flex-col gap-3"><Link to="/products" className="text-sm text-slate-600 hover:text-emerald-800">Shop all</Link><Link to="/products?category=clothing" className="text-sm text-slate-600 hover:text-emerald-800">Clothing</Link><Link to="/products?category=accessories" className="text-sm text-slate-600 hover:text-emerald-800">Accessories</Link><Link to="/products?category=shoes" className="text-sm text-slate-600 hover:text-emerald-800">Shoes</Link></nav></div>
          <div><h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-800">Your Cartly</h3><nav className="mt-4 flex flex-col gap-3"><Link to="/wishlist" className="text-sm text-slate-600 hover:text-emerald-800">Wishlist</Link><Link to="/cart" className="text-sm text-slate-600 hover:text-emerald-800">Your bag</Link><Link to="/" className="text-sm text-slate-600 hover:text-emerald-800">Our story</Link></nav></div>
          <div><h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-800">The fine print</h3><p className="mt-4 text-sm leading-6 text-slate-600">Cartly is a demo shop. Orders are for preview only and no payment details are collected.</p></div>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-300/70 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 Cartly. Made for the everyday.</p><p>Thoughtfully selected · Demo checkout · No payment collected</p></div>
      </section>
    </footer>
  )
}
