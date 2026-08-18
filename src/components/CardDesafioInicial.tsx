import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
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
  const concluidas = desafio.tarefas.filter((tarefa) => tarefa.concluida).length
  const proxima = desafio.tarefas.find((tarefa) => !tarefa.concluida)

  return (
    <button
      onClick={() => setAberto((v) => !v)}
      className="animar-entrada mt-5 w-full border-y border-line/60 py-4 text-left"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Comece por aqui</p><span className="num text-xs text-ink-2">{concluidas} de 4</span></div>
          <div className="mt-3 h-1 overflow-hidden bg-line"><div className="h-full bg-brand" style={{ width: `${desafio.percentual}%` }} /></div>
          <p className="mt-3 text-sm text-ink">{proxima?.label ?? 'Complete seus primeiros passos.'}</p>
          <p className="mt-2 text-xs font-semibold text-ink-2">Ver progresso</p>
        </div>
        <ChevronDown size={17} strokeWidth={1.75} className={`mt-1 shrink-0 text-ink-3 transition-transform ${aberto ? 'rotate-180' : ''}`} />
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
