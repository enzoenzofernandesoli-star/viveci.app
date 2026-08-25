import { useEffect, useState, type ReactNode } from 'react'

export function WorkoutCover({
  src,
  alt,
  children,
  fallback,
  slides,
  className = '',
}: {
  src?: string | null
  alt: string
  children: ReactNode
  fallback: ReactNode
  slides?: string[]
  className?: string
}) {
  const [falhou, setFalhou] = useState(false)
  const [slideAtivo, setSlideAtivo] = useState(0)

  useEffect(() => setFalhou(false), [src])

  useEffect(() => {
    setSlideAtivo(0)
    if (!slides || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const intervalo = window.setInterval(() => setSlideAtivo((atual) => (atual + 1) % slides.length), 5000)
    return () => window.clearInterval(intervalo)
  }, [slides])

  const temSlides = Boolean(slides?.length)

  return (
    <section className={`relative isolate min-h-[560px] overflow-hidden bg-card lg:min-h-[540px] ${className}`}>
      {temSlides ? (
        <div className="absolute inset-0 lg:right-[38%] lg:w-[62%]" aria-hidden="true">
          {slides!.map((foto, indice) => (
            <img
              key={foto}
              src={foto}
              alt=""
              fetchPriority={indice === 0 ? 'high' : 'auto'}
              loading={indice === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover object-[42%_center] transition-opacity duration-700 lg:object-[38%_center] ${indice === slideAtivo ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </div>
      ) : src && !falhou ? (
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
