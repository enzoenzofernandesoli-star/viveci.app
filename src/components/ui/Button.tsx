import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primary' | 'secondary' | 'ghost'
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; carregando?: boolean; children: ReactNode }

const ESTILO: Record<Variante, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary: 'border border-line bg-card text-ink hover:border-ink-3 hover:bg-card-hover',
  ghost: 'bg-transparent text-ink-2 hover:bg-card-hover hover:text-ink',
}

export function Button({ variante = 'primary', carregando = false, disabled, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-action)] px-5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-45 ${ESTILO[variante]} ${className}`}
      {...props}
    >
      {carregando && <span className="size-1.5 rounded-full bg-current animar-pulso" aria-hidden="true" />}
      {children}
    </button>
  )
}
