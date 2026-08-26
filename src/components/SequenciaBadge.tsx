import { useState } from 'react'
import { BicepsFlexed, Check, Lock, X } from 'lucide-react'
import { conquistasDaSequencia, nivelDaSequencia, type NivelSequencia } from '../lib/conquistasSequencia'
import { Modal } from './Modal'

const COR: Record<NivelSequencia, string> = {
  azul: 'text-brand border-brand/35 bg-brand/10',
  ferro: 'text-ink-3 border-ink-3/40 bg-ink-3/10',
  bronze: 'text-bronze border-bronze/40 bg-bronze/10',
  prata: 'text-silver border-silver/40 bg-silver/10',
  dourado: 'text-gold border-gold/40 bg-gold/10',
}

export function SequenciaBadge({ dias }: { dias: number }) {
  const [aberto, setAberto] = useState(false)
  const nivel = nivelDaSequencia(dias)
  if (!nivel) return null

  const conquistas = conquistasDaSequencia(dias)
  const atingidas = conquistas.filter((item) => item.atingida).length

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Sequência de ${dias} dias`}
        className={`relative flex min-h-10 items-center gap-1.5 rounded-full border px-2.5 transition-transform active:scale-95 ${COR[nivel]}`}
      >
        <BicepsFlexed size={19} strokeWidth={1.9} />
        <span className="num text-xs font-bold">{dias}</span>
      </button>

      {aberto && (
        <Modal fechar={() => setAberto(false)} rotulo="Conquistas de sequência">
          <div className="animar-escala max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[var(--radius-media)] border border-line bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Sua sequência</p>
                <h2 className="mt-1 text-xl font-semibold">{dias} dias de treino</h2>
                <p className="mt-1 text-xs text-ink-2">{atingidas} de {conquistas.length} conquistas atingidas</p>
              </div>
              <button onClick={() => setAberto(false)} aria-label="Fechar" className="flex size-11 items-center justify-center text-ink-2 hover:text-ink">
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="mt-5 divide-y divide-line/60 border-y border-line/60">
              {conquistas.map((conquista) => (
                <div key={conquista.nivel} className="flex min-h-16 items-center gap-3 py-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${COR[conquista.nivel]}`}>
                    <BicepsFlexed size={19} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${conquista.atingida ? 'text-ink' : 'text-ink-3'}`}>{conquista.nome}</p>
                    <p className="text-xs text-ink-2">{conquista.diasNecessarios} dias consecutivos</p>
                  </div>
                  {conquista.atingida ? <Check size={18} className="text-brand" /> : <Lock size={16} className="text-ink-3" />}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
