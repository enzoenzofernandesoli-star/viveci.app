import { useState } from 'react'
import { calcularRankCorporal } from '../lib/rankCorporal'
import { detectarDesequilibrios, type PercentualPorGrupo } from '../lib/mapaCorporal'
import { AcoesExportarMapa } from './AcoesExportarMapa'
import { MapaCorporal } from './MapaCorporal'

export function ExportarMapaTreino({ percentuais }: { percentuais: PercentualPorGrupo }) {
  const [erro, setErro] = useState<string | null>(null)
  const rank = calcularRankCorporal(percentuais)

  return (
    <section className="mt-8 border-y border-line/60 py-6 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Estímulos deste treino</p>
      <p className="mt-2 text-sm text-ink-2">Salve a frente ou inclua também as costas, sozinhas ou sobre uma foto.</p>
      <div className="mx-auto mt-4 max-w-64">
        <MapaCorporal percentuais={percentuais} desequilibrios={detectarDesequilibrios(percentuais)} />
      </div>
      {erro && <p role="alert" className="mt-3 text-xs text-down">{erro}</p>}
      <div className="mt-5"><AcoesExportarMapa percentuais={percentuais} rank={rank} onErro={setErro} /></div>
    </section>
  )
}
