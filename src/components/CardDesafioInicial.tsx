import { useState } from 'react'
import { ChevronRight, Check } from 'lucide-react'
import { usePerfil } from '../lib/perfil'
import { useRotinas } from '../lib/rotinas'
import { useHistoricoTreinos } from '../lib/historicoTreinos'
import { usePostsDoUsuario } from '../lib/social/posts'
import { calcularDesafioInicial } from '../lib/social/desafioInicial'

export function CardDesafioInicial({ userId }: { userId: string }) {
  const [aberto, setAberto] = useState(false)
  const { perfil } = usePerfil(userId)
  const { rotinas } = useRotinas(userId)
  const { treinos } = useHistoricoTreinos(userId, 1)
  const { posts } = usePostsDoUsuario(userId, userId)

  if (!perfil) return null

  const desafio = calcularDesafioInicial({
    onboardingCompleto: perfil.onboarding_completo,
    temRotinaCriada: rotinas.length > 0,
    temTreinoConcluido: treinos.length > 0,
    temPost: posts.length > 0,
  })

  if (desafio.percentual === 100) return null

  return (
    <button
      onClick={() => setAberto((v) => !v)}
      className="animar-entrada mt-4 w-full rounded-2xl border border-line bg-card p-4 text-left"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0">
          <svg viewBox="0 0 40 40" className="-rotate-90">
            <circle cx="20" cy="20" r="17" fill="none" stroke="var(--color-card-hover)" strokeWidth="4" />
            <circle
              cx="20"
              cy="20"
              r="17"
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(desafio.percentual / 100) * 106.8} 106.8`}
            />
          </svg>
          <span className="num absolute inset-0 flex items-center justify-center text-[11px] font-bold text-ink">
            {desafio.percentual}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Desafio inicial</p>
          <p className="text-xs text-ink-2">Complete os primeiros passos no VIVECI</p>
        </div>
        <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-ink-3" />
      </div>

      {aberto && (
        <div className="mt-4 space-y-2 border-t border-line pt-4">
          {desafio.tarefas.map((t) => (
            <div key={t.chave} className="flex items-center gap-2 text-sm">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  t.concluida ? 'border-brand bg-brand text-white' : 'border-line text-transparent'
                }`}
              >
                <Check size={12} strokeWidth={2.5} />
              </div>
              <span className={t.concluida ? 'text-ink-2 line-through' : 'text-ink'}>{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  )
}
