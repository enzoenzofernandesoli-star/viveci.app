import type { ReactNode } from 'react'
import { SectionTitle } from './ui/Typography'

/** Casca padrão de página: título + conteúdo. */
export function Page({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="animar-entrada mx-auto w-full max-w-[1120px]">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </div>
  )
}
