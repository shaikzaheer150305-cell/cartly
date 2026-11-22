import { useState } from 'react'
import { cn } from '../../lib/utils'
import { ProductImage } from './ProductImage'

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0)
  const sources = images.length > 0 ? images : ['']

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <ProductImage src={sources[selected]} alt={name} className="h-full w-full object-cover" />
      </div>
      {sources.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sources.map((source, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={selected === index}
              className={cn(
                'h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
                selected === index ? 'border-indigo-600' : 'border-transparent hover:border-slate-300',
              )}
            >
              <ProductImage src={source} alt={`${name} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
