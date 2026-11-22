import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { CloseIcon } from '../icons'

export function Drawer({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const panel = useRef<HTMLElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('button, a, input, select')?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !panel.current) return
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])'))
      if (!focusable.length) return
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus() }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); previous?.focus() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="presentation">
      <button type="button" aria-label="Close drawer" onClick={onClose} className="absolute inset-0 bg-slate-950/40" />
      <section ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-fade-up">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 id={titleId} className="text-lg font-semibold text-slate-900">{title}</h2><button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><CloseIcon className="h-5 w-5" /></button></header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-slate-200 p-5">{footer}</div>}
      </section>
    </div>
  )
}
