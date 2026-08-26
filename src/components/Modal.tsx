import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}

export function Modal({ children, fechar, rotulo }: { children: ReactNode; fechar: () => void; rotulo: string }) {
  useEffect(() => {
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') fechar()
    }

    window.addEventListener('keydown', aoPressionarTecla)
    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', aoPressionarTecla)
    }
  }, [fechar])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={rotulo}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) fechar()
      }}
    >
      {children}
    </div>,
    document.body,
  )
}
