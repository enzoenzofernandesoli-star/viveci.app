import { useEffect, useRef, useState } from 'react'
import { BodyChart, ViewSide, filterMuscles } from 'body-muscles'
import type { GrupoMuscular } from '../data/exercicios'
import type { PercentualPorGrupo, Desequilibrio } from '../lib/mapaCorporal'

const GRUPOS_FRENTE: GrupoMuscular[] = ['Ombros', 'Peito', 'Bíceps', 'Abdômen', 'Quadríceps']
const GRUPOS_COSTAS: GrupoMuscular[] = ['Costas', 'Tríceps', 'Glúteos', 'Posterior', 'Panturrilha']

/** Cada id anatômico da lib body-muscles mapeado pro nosso grupo muscular de 10 posições. */
const ID_PARA_GRUPO: Record<string, GrupoMuscular> = {
  'shoulder-front-left': 'Ombros',
  'shoulder-front-right': 'Ombros',
  'shoulder-side-left': 'Ombros',
  'shoulder-side-right': 'Ombros',
  'deltoid-rear-left': 'Ombros',
  'deltoid-rear-right': 'Ombros',
  'biceps-left': 'Bíceps',
  'biceps-right': 'Bíceps',
  'chest-upper-left': 'Peito',
  'chest-lower-left': 'Peito',
  'chest-upper-right': 'Peito',
  'chest-lower-right': 'Peito',
  'abs-upper-left': 'Abdômen',
  'abs-upper-right': 'Abdômen',
  'abs-lower-left': 'Abdômen',
  'abs-lower-right': 'Abdômen',
  'obliques-left': 'Abdômen',
  'obliques-right': 'Abdômen',
  'serratus-anterior-left': 'Abdômen',
  'serratus-anterior-right': 'Abdômen',
  'quads-left': 'Quadríceps',
  'quads-right': 'Quadríceps',
  'traps-upper-left': 'Costas',
  'traps-mid-left': 'Costas',
  'traps-lower-left': 'Costas',
  'traps-upper-right': 'Costas',
  'traps-mid-right': 'Costas',
  'traps-lower-right': 'Costas',
  'lats-upper-left': 'Costas',
  'lats-mid-left': 'Costas',
  'lats-lower-left': 'Costas',
  'lats-upper-right': 'Costas',
  'lats-mid-right': 'Costas',
  'lats-lower-right': 'Costas',
  'lower-back-erectors-left': 'Costas',
  'lower-back-erectors-right': 'Costas',
  'lower-back-ql-left': 'Costas',
  'lower-back-ql-right': 'Costas',
  'triceps-long-left': 'Tríceps',
  'triceps-lateral-left': 'Tríceps',
  'triceps-long-right': 'Tríceps',
  'triceps-lateral-right': 'Tríceps',
  'gluteus-medius-left': 'Glúteos',
  'gluteus-maximus-left': 'Glúteos',
  'gluteus-medius-right': 'Glúteos',
  'gluteus-maximus-right': 'Glúteos',
  'hamstrings-medial-left': 'Posterior',
  'hamstrings-lateral-left': 'Posterior',
  'hamstrings-medial-right': 'Posterior',
  'hamstrings-lateral-right': 'Posterior',
  'calves-gastroc-medial-left': 'Panturrilha',
  'calves-gastroc-lateral-left': 'Panturrilha',
  'calves-soleus-left': 'Panturrilha',
  'calves-gastroc-medial-right': 'Panturrilha',
  'calves-gastroc-lateral-right': 'Panturrilha',
  'calves-soleus-right': 'Panturrilha',
  'tibialis-anterior-left': 'Panturrilha',
  'tibialis-anterior-right': 'Panturrilha',
}

/**
 * A lib colore por gradiente amarelo→vermelho fixo, que fere o design system
 * (proibido gradiente colorido). Depois de cada render/hover da lib, repintamos
 * os paths na ordem em que `filterMuscles` os devolve — é a mesma ordem em que
 * a lib os insere no SVG — com `muscle-off` ou `brand` em opacidade, igual ao
 * resto do app.
 */
function repintar(container: HTMLElement, vista: ViewSide, percentuais: PercentualPorGrupo) {
  const ordenado = filterMuscles(vista)
  const paths = container.querySelectorAll<SVGPathElement>('.body-chart-muscle')
  ordenado.forEach((musculo, i) => {
    const el = paths[i]
    if (!el) return
    const grupo = ID_PARA_GRUPO[musculo.id]
    const percentual = grupo ? percentuais[grupo] : 0
    el.setAttribute('fill', percentual > 0 ? 'var(--color-brand)' : 'var(--color-muscle-off)')
    el.style.fillOpacity = percentual > 0 ? String(0.35 + (percentual / 100) * 0.65) : '1'
    el.setAttribute('stroke', 'var(--color-line)')
    el.setAttribute('stroke-width', '0.15')
    el.style.filter = 'none'
  })
}

export function MapaCorporal({
  percentuais,
  desequilibrios,
}: {
  percentuais: PercentualPorGrupo
  desequilibrios: Desequilibrio[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<BodyChart | null>(null)
  const [vista, setVista] = useState<ViewSide>(ViewSide.FRONT)

  // a lib guarda o callback de hover só na criação; usamos refs pra sempre ler
  // a vista/percentuais atuais, e adiamos o repaint porque a lib pinta a cor
  // dela mesma DEPOIS de chamar onMuscleHover (senão a nossa cor é sobrescrita).
  const vistaRef = useRef(vista)
  const percentuaisRef = useRef(percentuais)
  vistaRef.current = vista
  percentuaisRef.current = percentuais

  useEffect(() => {
    if (!containerRef.current) return
    chartRef.current = new BodyChart(containerRef.current, {
      view: vistaRef.current,
      bodyState: {},
      showViewLabel: false,
      onMuscleHover: () => {
        setTimeout(() => {
          if (containerRef.current) repintar(containerRef.current, vistaRef.current, percentuaisRef.current)
        }, 0)
      },
    })
    repintar(containerRef.current, vistaRef.current, percentuaisRef.current)
    return () => chartRef.current?.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!chartRef.current || !containerRef.current) return
    chartRef.current.update({ view: vista })
    repintar(containerRef.current, vista, percentuais)
  }, [vista, percentuais])

  const grupos = vista === ViewSide.FRONT ? GRUPOS_FRENTE : GRUPOS_COSTAS

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold">Mapa corporal</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVista(ViewSide.FRONT)}
            className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors ${
              vista === ViewSide.FRONT ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
            }`}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setVista(ViewSide.BACK)}
            className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors ${
              vista === ViewSide.BACK ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
            }`}
          >
            Costas
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-ink-2">Volume treinado nos últimos 7 dias.</p>

      <div ref={containerRef} className="mx-auto w-56 [&_svg]:mx-auto [&_svg]:!max-h-none" />

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
