import { useEffect, useState, type ReactNode } from 'react'

export function WorkoutCover({
  src,
  alt,
  children,
  fallback,
  className = '',
}: {
  src?: string | null
  alt: string
  children: ReactNode
  fallback: ReactNode
  className?: string
}) {
  const [falhou, setFalhou] = useState(false)

  useEffect(() => setFalhou(false), [src])

  return (
    <section className={`relative isolate min-h-[560px] overflow-hidden bg-card lg:min-h-[540px] ${className}`}>
      {src && !falhou ? (
        <img
          src={src}
          alt={alt}
          fetchPriority="high"
          decoding="async"
          onError={() => setFalhou(true)}
          className="absolute inset-0 h-full w-full object-cover object-[42%_center] lg:right-[38%] lg:w-[62%] lg:object-[38%_center]"
        />
      ) : (
        <div className="absolute inset-0 lg:right-[38%] lg:w-[62%]" role="img" aria-label={alt}>
          {fallback}
        </div>
      )}

      <div className="absolute inset-0 flex flex-col justify-end bg-[linear-gradient(180deg,rgba(7,10,16,0.02)_22%,rgba(7,10,16,0.34)_52%,rgba(7,10,16,0.98)_100%)] p-6 sm:p-8 lg:left-[58%] lg:justify-center lg:bg-app lg:px-10 lg:py-12">
        {children}
      </div>
    </section>
  )
}
