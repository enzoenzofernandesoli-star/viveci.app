import type { ReactNode } from 'react'

export function EditorialMedia({ src, alt, children, className = '' }: { src?: string | null; alt: string; children?: ReactNode; className?: string }) {
  return (
    <div className={`relative isolate overflow-hidden bg-card-hover ${className}`}>
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : <div className="h-full min-h-32 w-full bg-card-hover" role="img" aria-label={alt} />}
      {children && <div className="absolute inset-0 flex flex-col justify-end bg-black/45 p-5">{children}</div>}
    </div>
  )
}
