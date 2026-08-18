import type { ReactNode } from 'react'

export function EditorialMedia({
  src,
  alt,
  children,
  fallback,
  className = '',
  overlayClassName = '',
}: {
  src?: string | null
  alt: string
  children?: ReactNode
  fallback?: ReactNode
  className?: string
  overlayClassName?: string
}) {
  return (
    <div className={`relative isolate overflow-hidden bg-card-hover ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full min-h-32 w-full bg-card-hover" role="img" aria-label={alt}>
          {fallback}
        </div>
      )}
      {children && <div className={`absolute inset-0 flex flex-col justify-end bg-black/45 p-5 ${overlayClassName}`}>{children}</div>}
    </div>
  )
}
