import { useEffect, useRef } from 'react'
import { BodyChart, ViewSide, filterMuscles } from 'body-muscles'
import type { PercentualPorGrupo } from '../lib/mapaCorporal.ts'
import { ID_PARA_GRUPO } from './MapaCorporal.tsx'

function Corpo({ vista, percentuais }: { vista: ViewSide; percentuais: PercentualPorGrupo }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const container = ref.current
    const chart = new BodyChart(container, { view: vista, bodyState: {}, showViewLabel: false })
    const caminhos = container.querySelectorAll<SVGPathElement>('.body-chart-muscle')
    filterMuscles(vista).forEach((musculo, indice) => {
      const caminho = caminhos[indice]
      const grupo = ID_PARA_GRUPO[musculo.id]
      const percentual = grupo ? percentuais[grupo] : 0
      if (!caminho) return
      caminho.setAttribute('fill', percentual > 0 ? 'var(--color-brand)' : 'var(--color-muscle-off)')
      caminho.setAttribute('stroke', 'var(--color-line)')
      caminho.setAttribute('stroke-width', '0.15')
      caminho.style.fillOpacity = percentual > 0 ? String(0.35 + percentual * 0.0065) : '1'
      caminho.style.filter = 'none'
      caminho.style.pointerEvents = 'none'
    })
    return () => chart.destroy()
  }, [vista, percentuais])

  return <div ref={ref} className="w-[42%] [&_svg]:mx-auto [&_svg]:!max-h-[330px]" />
}

export function MapaEstimuloSocial({ percentuais }: { percentuais: PercentualPorGrupo }) {
  return (
    <div className="flex h-full flex-col bg-card px-5 py-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand">Treino compartilhado</p>
        <h3 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-ink">Mapa de estímulo</h3>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 overflow-hidden">
        <Corpo vista={ViewSide.FRONT} percentuais={percentuais} />
        <Corpo vista={ViewSide.BACK} percentuais={percentuais} />
      </div>
      <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.08em] text-ink-3">
        <span>Baixo</span><div className="flex h-1 flex-1 overflow-hidden bg-line"><span className="w-1/3 bg-brand/35" /><span className="w-1/3 bg-brand/65" /><span className="w-1/3 bg-brand" /></div><span>Alto</span>
      </div>
    </div>
  )
}
