import type { ReactNode } from 'react'

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-2 ${className}`}>{children}</p>
}

export function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h1 className={`text-[26px] font-semibold leading-[1.15] tracking-[-0.035em] text-ink lg:text-[32px] ${className}`}>{children}</h1>
}

export function MetaText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs leading-relaxed text-ink-2 ${className}`}>{children}</p>
}
