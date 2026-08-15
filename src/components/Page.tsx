import type { ReactNode } from 'react'

/** Casca padrão de página: título + conteúdo. */
export function Page({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight lg:text-[28px]">{title}</h1>
      {children}
    </>
  )
}
