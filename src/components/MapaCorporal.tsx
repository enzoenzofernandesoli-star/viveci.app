import { useState } from 'react'
import type { GrupoMuscular } from '../data/exercicios'
import type { PercentualPorGrupo, Desequilibrio } from '../lib/mapaCorporal'

type Vista = 'frente' | 'costas'

const GRUPOS_FRENTE: GrupoMuscular[] = ['Ombros', 'Peito', 'Bíceps', 'Abdômen', 'Quadríceps']
const GRUPOS_COSTAS: GrupoMuscular[] = ['Costas', 'Tríceps', 'Glúteos', 'Posterior', 'Panturrilha']

function corGrupo(percentual: number): { cor: string; opacidade: number } {
  if (percentual <= 0) return { cor: 'var(--color-muscle-off)', opacidade: 1 }
  return { cor: 'var(--color-brand)', opacidade: 0.35 + (percentual / 100) * 0.65 }
}

function Regiao({
  grupo,
  percentual,
  d,
}: {
  grupo: GrupoMuscular
  percentual: number
  d: string
}) {
  const { cor, opacidade } = corGrupo(percentual)
  return (
    <path d={d} fill={cor} opacity={opacidade}>
      <title>
        {grupo}: {percentual}%
      </title>
    </path>
  )
}

function CorpoFrente({ percentuais }: { percentuais: PercentualPorGrupo }) {
  return (
    <svg viewBox="0 0 200 400" className="mx-auto h-80 w-40">
      {/* silhueta base */}
      <path
        d="M100 20 a18 18 0 1 0 0.1 0 M70 55 q30 -10 60 0 l10 60 q-15 15 -10 40 l-8 90 h-20 l-4 -80 h-12 l-4 80 h-20 l-8 -90 q5 -25 -10 -40 z"
        fill="none"
        stroke="var(--color-line)"
        strokeWidth="2"
      />
      <Regiao grupo="Ombros" percentual={percentuais['Ombros']} d="M62 60 q10 -12 20 -4 l-4 22 q-14 4 -20 -6 z M138 60 q-10 -12 -20 -4 l4 22 q14 4 20 -6 z" />
      <Regiao grupo="Peito" percentual={percentuais['Peito']} d="M78 58 q22 -8 44 0 l-4 34 q-18 8 -36 0 z" />
      <Regiao grupo="Bíceps" percentual={percentuais['Bíceps']} d="M60 82 q-8 4 -8 26 l10 4 q6 -14 4 -30 z M140 82 q8 4 8 26 l-10 4 q-6 -14 -4 -30 z" />
      <Regiao grupo="Abdômen" percentual={percentuais['Abdômen']} d="M82 96 q18 -6 36 0 l-2 36 q-16 8 -32 0 z" />
      <Regiao
        grupo="Quadríceps"
        percentual={percentuais['Quadríceps']}
        d="M80 172 q-6 34 -8 62 l20 2 q4 -32 6 -60 z M120 172 q6 34 8 62 l-20 2 q-4 -32 -6 -60 z"
      />
    </svg>
  )
}

function CorpoCostas({ percentuais }: { percentuais: PercentualPorGrupo }) {
  return (
    <svg viewBox="0 0 200 400" className="mx-auto h-80 w-40">
      <path
        d="M100 20 a18 18 0 1 0 0.1 0 M70 55 q30 -10 60 0 l10 60 q-15 15 -10 40 l-8 90 h-20 l-4 -80 h-12 l-4 80 h-20 l-8 -90 q5 -25 -10 -40 z"
        fill="none"
        stroke="var(--color-line)"
        strokeWidth="2"
      />
      <Regiao grupo="Costas" percentual={percentuais['Costas']} d="M76 58 q24 -10 48 0 l-4 56 q-20 10 -40 0 z" />
      <Regiao grupo="Tríceps" percentual={percentuais['Tríceps']} d="M60 82 q-8 4 -8 26 l10 4 q6 -14 4 -30 z M140 82 q8 4 8 26 l-10 4 q-6 -14 -4 -30 z" />
      <Regiao grupo="Glúteos" percentual={percentuais['Glúteos']} d="M80 160 q20 -6 40 0 l-2 24 q-18 8 -36 0 z" />
      <Regiao grupo="Posterior" percentual={percentuais['Posterior']} d="M80 186 q-6 26 -8 46 l20 2 q4 -24 6 -46 z M120 186 q6 26 8 46 l-20 2 q-4 -24 -6 -46 z" />
      <Regiao
        grupo="Panturrilha"
        percentual={percentuais['Panturrilha']}
        d="M78 260 q-4 30 -6 50 l16 2 q3 -26 5 -50 z M122 260 q4 30 6 50 l-16 2 q-3 -26 -5 -50 z"
      />
    </svg>
  )
}

export function MapaCorporal({
  percentuais,
  desequilibrios,
}: {
  percentuais: PercentualPorGrupo
  desequilibrios: Desequilibrio[]
}) {
  const [vista, setVista] = useState<Vista>('frente')
  const grupos = vista === 'frente' ? GRUPOS_FRENTE : GRUPOS_COSTAS

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold">Mapa corporal</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVista('frente')}
            className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors ${
              vista === 'frente' ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
            }`}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setVista('costas')}
            className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors ${
              vista === 'costas' ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
            }`}
          >
            Costas
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-ink-2">Volume treinado nos últimos 7 dias.</p>

      {vista === 'frente' ? <CorpoFrente percentuais={percentuais} /> : <CorpoCostas percentuais={percentuais} />}

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {grupos.map((g) => (
          <div key={g} className="flex items-center justify-between text-sm">
            <span className="text-ink-2">{g}</span>
            <span className="num text-ink">{percentuais[g]}%</span>
          </div>
        ))}
      </div>

      {desequilibrios.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-line pt-4">
          {desequilibrios.map((d) => (
            <p key={d.grupoMaisTreinado + d.grupoMenosTreinado} className="text-sm text-ink-2">
              <span className="text-gold">{d.grupoMaisTreinado}</span> ficou {d.diferenca} pontos à frente de{' '}
              {d.grupoMenosTreinado} nos últimos 7 dias.
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
