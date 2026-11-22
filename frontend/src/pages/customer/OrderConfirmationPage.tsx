import { Link, useParams } from 'react-router-dom'
import { CheckIcon } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { money } from '../../lib/store'

type DemoOrder = { id: string; count: number; total: number; createdAt: string }
function latestOrder(): DemoOrder | null {
  try { return JSON.parse(localStorage.getItem('cartly.demo.latestOrder') ?? 'null') as DemoOrder | null } catch { return null }
}

export function OrderConfirmationPage() {
  const { id = '' } = useParams()
  const order = latestOrder()
  if (!order || order.id !== id) return <div className="mx-auto max-w-lg py-20 text-center"><h1 className="text-2xl font-semibold">Order details aren’t available</h1><p className="mt-2 text-sm text-slate-500">Demo confirmations are kept in this browser after checkout.</p><Link to="/products" className="mt-5 inline-block"><Button>Continue shopping</Button></Link></div>
  return <div className="mx-auto max-w-xl py-10 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><CheckIcon className="h-8 w-8"/></span><p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800">That’s a wrap</p><h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">Your demo order is in.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">Thanks for shopping with Cartly. This order is a local preview only—no payment was taken and no shipment was created.</p><div className="mt-8 rounded-2xl bg-[#f4f3ef] p-5 text-left sm:p-7"><div className="flex items-center justify-between border-b border-slate-300 pb-4"><div><p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Order reference</p><p className="mt-1 font-mono text-sm font-semibold">{order.id}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold text-emerald-900">Demo confirmed</span></div><div className="grid grid-cols-2 gap-4 pt-4"><div><p className="text-[10px] text-slate-500">Items</p><p className="mt-1 text-sm font-medium">{order.count}</p></div><div className="text-right"><p className="text-[10px] text-slate-500">Estimated total</p><p className="mt-1 text-sm font-semibold">{money(order.total)}</p></div></div><p className="mt-4 text-[10px] leading-5 text-slate-500">Your confirmation stays in this browser. We did not store your address or collect payment information.</p></div><div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/products"><Button>Continue shopping</Button></Link><Link to="/wishlist"><Button variant="secondary">View wishlist</Button></Link></div></div>
}
