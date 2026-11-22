import { useState } from 'react'

function fallbackFor(label: string): string {
  const text = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 42)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef2ff"/><stop offset="1" stop-color="#e2e8f0"/></linearGradient></defs><rect width="640" height="640" fill="url(#g)"/><circle cx="320" cy="270" r="96" fill="#c7d2fe"/><path d="M250 300h140M270 270h100" stroke="#fff" stroke-width="16" stroke-linecap="round"/><text x="320" y="440" text-anchor="middle" fill="#475569" font-size="26" font-family="Inter,Arial,sans-serif" font-weight="600">${text}</text><text x="320" y="478" text-anchor="middle" fill="#64748b" font-size="18" font-family="Inter,Arial,sans-serif">Image unavailable</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function ProductImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const fallback = fallbackFor(alt)
  const [failedFor, setFailedFor] = useState<string | null>(null)
  const source = failedFor === src ? fallback : src || fallback

  return (
    <img
      src={source}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (source !== fallback) setFailedFor(src ?? null)
      }}
      className={className}
    />
  )
}
