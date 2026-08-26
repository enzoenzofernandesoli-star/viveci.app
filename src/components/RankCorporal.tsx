import { useState } from 'react'
import { Check, Lock, X } from 'lucide-react'
import { RANKS_CORPORAIS, type RankCorporal as Rank } from '../lib/rankCorporal'

export function BrasaoRank({ rank, tamanho = 112 }: { rank: Rank; tamanho?: number }) {
  const camadas = Math.min(4, 1 + Math.floor(rank.indice / 2))
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 120 120" role="img" aria-label={`Brasão ${rank.nome}`}>
      <path d="M60 5 105 28v47L60 115 15 75V28Z" fill="#0D111A" stroke={rank.cor} strokeWidth="2" />
      <path d="M60 17 93 34v34L60 101 27 68V34Z" fill="none" stroke={rank.cor} strokeOpacity=".42" />
      {camadas >= 2 && <path d="M60 27 83 39v24L60 88 37 63V39Z" fill={rank.cor} fillOpacity=".12" stroke={rank.cor} strokeWidth="1.5" />}
      {camadas >= 3 && <path d="m60 35 15 16-15 24-15-24Z" fill="none" stroke={rank.cor} strokeWidth="2" />}
      {camadas >= 4 && <path d="m60 44 8 9-8 13-8-13Z" fill={rank.cor} />}
      <path d="m31 80 29 27 29-27" fill="none" stroke={rank.cor} strokeWidth={rank.indice >= 6 ? 3 : 1.5} />
    </svg>
  )
}

export function PainelRankCorporal({ rank }: { rank: Rank }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
    <section
      aria-labelledby="titulo-rank"
      role="button"
      tabIndex={0}
      onClick={() => setAberto(true)}
      onKeyDown={(evento) => { if (evento.key === 'Enter' || evento.key === ' ') setAberto(true) }}
      className="grid cursor-pointer items-center gap-6 border-y border-line/60 py-7 transition-colors hover:bg-card/35 sm:grid-cols-[140px_1fr] sm:gap-10"
    >
      <div className="flex justify-center sm:justify-start">
        <BrasaoRank rank={rank} tamanho={132} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-2">Rank corporal semanal</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h2 id="titulo-rank" className="text-[34px] font-semibold leading-none tracking-[-0.055em]" style={{ color: rank.cor }}>{rank.nome}</h2>
          <span className="num text-sm text-ink-2">Média {rank.mediaSemanal}%</span>
        </div>
        <div className="mt-6 h-1.5 overflow-hidden bg-line" aria-label={`${rank.progressoNoRank}% até o próximo rank`}>
          <div className="h-full transition-[width] duration-500" style={{ width: `${rank.progressoNoRank}%`, backgroundColor: rank.cor }} />
        </div>
        <p className="mt-3 text-xs text-ink-2">
          {rank.proximoRank
            ? `Faltam ${rank.pontosParaProximo} pontos de média para ${rank.proximoRank}.`
            : 'Você alcançou o rank máximo desta semana.'}
        </p>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand">Ver todos os ranks</p>
      </div>
    </section>

    {aberto && (
      <div role="dialog" aria-modal="true" aria-label="Progressão de ranks" className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
        <div className="animar-entrada max-h-[82dvh] w-full max-w-md overflow-y-auto rounded-[var(--radius-media)] border border-line bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Progressão corporal</p>
              <h2 className="mt-1 text-xl font-semibold">Seus ranks</h2>
              <p className="mt-1 text-xs text-ink-2">{rank.indice + 1} de {RANKS_CORPORAIS.length} desbloqueados</p>
            </div>
            <button onClick={() => setAberto(false)} aria-label="Fechar" className="flex size-11 items-center justify-center text-ink-2 hover:text-ink">
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>
          <div className="mt-5 divide-y divide-line/60 border-y border-line/60">
            {RANKS_CORPORAIS.map((item, indice) => {
              const desbloqueado = indice <= rank.indice
              return (
                <div key={item.nome} className="flex min-h-20 items-center gap-3 py-3">
                  <div className={desbloqueado ? '' : 'grayscale opacity-35'}><BrasaoRank rank={{ ...rank, nome: item.nome, indice, cor: item.cor }} tamanho={58} /></div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${desbloqueado ? 'text-ink' : 'text-ink-3'}`}>{item.nome}</p>
                    <p className="text-xs text-ink-2">Média semanal a partir de {item.minimo}%</p>
                  </div>
                  {desbloqueado ? <Check size={18} className="text-brand" /> : <Lock size={16} className="text-ink-3" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
