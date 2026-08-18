import { useEffect, useRef, useState } from 'react'
import { BodyChart, ViewSide, filterMuscles } from 'body-muscles'
import type { GrupoMuscular } from '../data/exercicios'
import type { PercentualPorGrupo, Desequilibrio, EstatisticasGrupo } from '../lib/mapaCorporal'

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
 * resto do app. Também anexamos o clique aqui: cada path vira clicável e
 * seleciona o grupo correspondente (o grupo selecionado ganha contorno).
 */
function repintar(
  container: HTMLElement,
  vista: ViewSide,
  percentuais: PercentualPorGrupo,
  selecionado: GrupoMuscular | null,
  onClicar: (grupo: GrupoMuscular) => void,
) {
  const ordenado = filterMuscles(vista)
  const paths = container.querySelectorAll<SVGPathElement>('.body-chart-muscle')
  ordenado.forEach((musculo, i) => {
    const el = paths[i]
    if (!el) return
    const grupo = ID_PARA_GRUPO[musculo.id]
    const percentual = grupo ? percentuais[grupo] : 0
    const ativo = grupo !== undefined && grupo === selecionado
    el.setAttribute('fill', percentual > 0 ? 'var(--color-brand)' : 'var(--color-muscle-off)')
    el.style.fillOpacity = percentual > 0 ? String(0.35 + (percentual / 100) * 0.65) : '1'
    el.setAttribute('stroke', ativo ? 'var(--color-ink)' : 'var(--color-line)')
    el.setAttribute('stroke-width', ativo ? '0.6' : '0.15')
    el.style.filter = 'none'
    el.style.cursor = grupo ? 'pointer' : 'default'
    el.onclick = grupo ? () => onClicar(grupo) : null
  })
}

function PainelMusculo({
  grupo,
  percentual,
  estatisticas,
  onFechar,
  editorial,
}: {
  grupo: GrupoMuscular
  percentual: number
  estatisticas: EstatisticasGrupo | undefined
  onFechar: () => void
  editorial: boolean
}) {
  return (
    <div className={`animar-escala mt-5 ${editorial ? 'border-t border-line/70 pt-5' : 'rounded-xl border border-line bg-card-hover p-4'}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{grupo}</h3>
        <button onClick={onFechar} aria-label="Fechar" className="text-xs font-semibold text-ink-2 hover:text-ink">
          Fechar
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-2">Últimos 7 dias: {percentual}% do volume máximo</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="num font-semibold text-ink">{estatisticas?.treinos ?? 0}</p>
          <p className="text-xs text-ink-2">treinos (30d)</p>
        </div>
        <div>
          <p className="num font-semibold text-ink">{estatisticas?.series ?? 0}</p>
          <p className="text-xs text-ink-2">séries (30d)</p>
        </div>
        <div>
          <p className="num font-semibold text-ink">{(estatisticas?.volumeKg ?? 0).toLocaleString('pt-BR')} kg</p>
          <p className="text-xs text-ink-2">volume (30d)</p>
        </div>
        <div>
          <p className="num font-semibold text-ink">
            {estatisticas?.ultimoEstimuloDias === null || estatisticas?.ultimoEstimuloDias === undefined
              ? '—'
              : estatisticas.ultimoEstimuloDias === 0
                ? 'Hoje'
                : `${estatisticas.ultimoEstimuloDias}d`}
          </p>
          <p className="text-xs text-ink-2">último estímulo</p>
        </div>
      </div>
    </div>
  )
}

export function MapaCorporal({
  percentuais,
  desequilibrios,
  estatisticasPorGrupo,
  modoEditorial = false,
}: {
  percentuais: PercentualPorGrupo
  desequilibrios: Desequilibrio[]
  estatisticasPorGrupo?: Record<GrupoMuscular, EstatisticasGrupo>
  modoEditorial?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<BodyChart | null>(null)
  const [vista, setVista] = useState<ViewSide>(ViewSide.FRONT)
  const [selecionado, setSelecionado] = useState<GrupoMuscular | null>(null)

  // a lib guarda o callback de hover só na criação; usamos refs pra sempre ler
  // a vista/percentuais/seleção atuais, e adiamos o repaint porque a lib pinta
  // a cor dela mesma DEPOIS de chamar onMuscleHover (senão nossa cor é sobrescrita).
  const vistaRef = useRef(vista)
  const percentuaisRef = useRef(percentuais)
  const selecionadoRef = useRef(selecionado)
  vistaRef.current = vista
  percentuaisRef.current = percentuais
  selecionadoRef.current = selecionado

  function selecionarGrupo(grupo: GrupoMuscular) {
    setSelecionado((atual) => (atual === grupo ? null : grupo))
  }

  useEffect(() => {
    if (!containerRef.current) return
    chartRef.current = new BodyChart(containerRef.current, {
      view: vistaRef.current,
      bodyState: {},
      showViewLabel: false,
      onMuscleHover: () => {
        setTimeout(() => {
          if (containerRef.current) {
            repintar(containerRef.current, vistaRef.current, percentuaisRef.current, selecionadoRef.current, selecionarGrupo)
          }
        }, 0)
      },
    })
    repintar(containerRef.current, vistaRef.current, percentuaisRef.current, selecionadoRef.current, selecionarGrupo)
    return () => chartRef.current?.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!chartRef.current || !containerRef.current) return
    chartRef.current.update({ view: vista })
    repintar(containerRef.current, vista, percentuais, selecionado, selecionarGrupo)
  }, [vista, percentuais, selecionado])

  const grupos = vista === ViewSide.FRONT ? GRUPOS_FRENTE : GRUPOS_COSTAS

  return (
    <div className={modoEditorial ? '' : 'rounded-2xl border border-line bg-card p-6'}>
      <div className={`flex items-center ${modoEditorial ? 'justify-end' : 'justify-between'}`}>
        {!modoEditorial && <h2 className="text-[17px] font-semibold">Mapa corporal</h2>}
        <div className="flex gap-1 border-b border-line/70">
          <button
            type="button"
            onClick={() => setVista(ViewSide.FRONT)}
            className={`relative min-h-11 px-4 text-xs font-semibold transition-colors ${
              vista === ViewSide.FRONT ? 'text-brand after:absolute after:inset-x-2 after:-bottom-px after:h-px after:bg-brand' : 'text-ink-2'
            }`}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setVista(ViewSide.BACK)}
            className={`relative min-h-11 px-4 text-xs font-semibold transition-colors ${
              vista === ViewSide.BACK ? 'text-brand after:absolute after:inset-x-2 after:-bottom-px after:h-px after:bg-brand' : 'text-ink-2'
            }`}
          >
            Costas
          </button>
        </div>
      </div>

      {!modoEditorial && <p className="mt-1 text-xs text-ink-2">Toque num músculo pra ver os detalhes. Volume dos últimos 7 dias.</p>}

      <div ref={containerRef} className={`mx-auto [&_svg]:mx-auto [&_svg]:!max-h-none ${modoEditorial ? 'w-64 sm:w-72' : 'w-56'}`} />

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {grupos.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => selecionarGrupo(g)}
            className={`flex min-h-10 items-center justify-between px-2 text-sm transition-colors ${
              selecionado === g ? 'text-brand' : 'hover:text-ink'
            }`}
          >
            <span className={selecionado === g ? 'text-brand' : 'text-ink-2'}>{g}</span>
            <span className="num text-ink">{percentuais[g]}%</span>
          </button>
        ))}
      </div>

      {selecionado && (
        <PainelMusculo
          grupo={selecionado}
          percentual={percentuais[selecionado]}
          estatisticas={estatisticasPorGrupo?.[selecionado]}
          onFechar={() => setSelecionado(null)}
          editorial={modoEditorial}
        />
      )}

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
