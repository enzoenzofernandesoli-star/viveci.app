import { Activity, Trophy } from 'lucide-react'
import { EXERCICIOS } from '../../data/exercicios'
import type { DailyScore } from '../../lib/dailyScore'
import type { MusculoNegligenciado } from '../../lib/mapaCorporal'
import type { EventoPR } from '../../lib/recordesPessoais'
import { Divider } from '../ui/Surface'
import { Eyebrow, MetaText } from '../ui/Typography'

export function MotivosRecomendacao({ motivos }: { motivos: string[] }) {
  if (motivos.length === 0) return null
  return (
    <section aria-labelledby="titulo-motivos" className="py-7 sm:py-8">
      <Eyebrow>Por que hoje</Eyebrow>
      <div id="titulo-motivos" className="mt-5 max-w-2xl divide-y divide-line/60">
        {motivos.map((motivo, indice) => (
          <div key={motivo} className="grid grid-cols-[2.25rem_1fr] gap-3 py-3 first:pt-0 last:pb-0">
            <span className="num pt-0.5 text-[10px] font-semibold text-brand">{String(indice + 1).padStart(2, '0')}</span>
            <p className="text-[15px] leading-relaxed tracking-[-0.015em] text-ink sm:text-base">{motivo}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ProgressoRecente({ eventos, negligenciado }: { eventos: EventoPR[]; negligenciado: MusculoNegligenciado | null }) {
  const recente = eventos.at(-1)
  if (!recente && !negligenciado) return null
  const exercicio = recente ? EXERCICIOS.find((item) => item.id === recente.exercicioId) : null

  return (
    <section aria-labelledby="titulo-progresso" className="py-8 sm:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Progresso recente</Eyebrow>
          <h2 id="titulo-progresso" className="mt-2 text-xl font-semibold tracking-[-0.035em]">Sinais do seu histórico</h2>
        </div>
        <Activity size={20} strokeWidth={1.5} className="text-ink-3" aria-hidden="true" />
      </div>

      {recente && (
        <div className="mt-7 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-gold">
              <Trophy size={16} strokeWidth={1.6} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Novo PR</span>
            </div>
            <p className="mt-3 text-lg font-semibold tracking-[-0.03em]">{exercicio?.nome ?? 'Exercício'}</p>
            <MetaText className="mt-1">{recente.atual.reps} repetições no registro mais recente</MetaText>
          </div>
          <div className="text-left sm:text-right">
            <p className="num text-[38px] font-semibold leading-none text-ink">{recente.atual.peso_kg.toLocaleString('pt-BR')} kg</p>
            <p className="num mt-2 text-xs font-semibold text-up">+{recente.variacaoPercentual.toLocaleString('pt-BR')}%</p>
          </div>
        </div>
      )}

      {recente && negligenciado && <Divider className="my-7" />}

      {negligenciado && (
        <div>
          <Eyebrow>Em foco</Eyebrow>
          <p className="mt-2 text-base font-semibold">{negligenciado.grupo}</p>
          <MetaText className="mt-1 max-w-xl">
            Está com {negligenciado.percentual}% do volume relativo de {negligenciado.grupoReferencia}. Considere esse dado ao organizar suas próximas rotinas.
          </MetaText>
        </div>
      )}
    </section>
  )
}

export function ResumoDia({ score }: { score: DailyScore }) {
  const itens = [
    ['Treino', score.treino],
    ['Alimentação', score.alimentacao],
    ['Consistência', score.consistencia],
    ['Evolução', score.evolucao],
  ] as const

  return (
    <section aria-labelledby="titulo-dia" className="py-8 sm:py-10">
      <Eyebrow>Seu dia</Eyebrow>
      <div className="mt-4 flex items-end gap-5">
        <p id="titulo-dia" className="num text-[64px] font-semibold leading-[0.9] tracking-[-0.07em]">{score.score}</p>
        <div className="pb-0.5">
          <p className="text-sm font-medium text-ink">Seu ritmo hoje</p>
          <MetaText className="mt-1 max-w-56">Indicador interno dos dados registrados, não uma nota de saúde.</MetaText>
        </div>
      </div>
      <div className="mt-7 divide-y divide-line/60 border-y border-line/60">
        {itens.map(([label, valor]) => (
          <div key={label} className="grid min-h-12 grid-cols-[6.25rem_1fr_2.5rem] items-center gap-3 text-xs">
            <span className="text-ink-2">{label}</span>
            <div className="h-px overflow-hidden bg-line">
              <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${valor}%` }} />
            </div>
            <span className="num text-right font-semibold text-ink">{valor}%</span>
          </div>
        ))}
      </div>
    </section>
  )
}
