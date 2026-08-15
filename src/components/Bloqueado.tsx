import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

/** Conteúdo desfocado com cadeado e CTA único, pra áreas fora do plano do usuário. */
export function Bloqueado({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none select-none blur-sm">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-app/60 px-6 text-center">
        <Lock strokeWidth={1.75} className="h-6 w-6 text-ink-2" />
        <button
          onClick={() => navigate('/planos')}
          className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Ver planos
        </button>
      </div>
    </div>
  )
}
