import type { HTMLAttributes, ReactNode } from 'react'

export function Surface({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={`rounded-[var(--radius-surface)] border border-line/80 bg-card ${className}`} {...props}>{children}</div>
}

export function Divider({ className = '' }: { className?: string }) {
  return <div role="separator" className={`h-px bg-line/70 ${className}`} />
}
