import { Activity } from 'lucide-react'
import { Empty } from '../components/Empty'
import { MapaCorporal } from '../components/MapaCorporal'
import { Divider } from '../components/ui/Surface'
import { Eyebrow, MetaText } from '../components/ui/Typography'
import { useSessao } from '../lib/auth'
import { GRUPOS_MUSCULARES } from '../lib/mapaCorporal'
import { usePerfil } from '../lib/perfil'
import { useRotinas } from '../lib/rotinas'
import { useVivici } from '../lib/vivici'

export default function Corpo() {
  const { sessao } = useSessao()
  const perfilState = usePerfil(sessao?.user.id)
  const rotinasState = useRotinas(sessao?.user.id)
  const viviciState = useVivici(
    sessao?.user.id,
    rotinasState.rotinas,
    perfilState.perfil?.dias_semana ?? 0,
    0,
    0,
  )
  const resultado = viviciState.resultado

  return (
    <div className="animar-entrada mx-auto w-full max-w-[1120px]">
      <header className="flex items-end justify-between gap-5 border-b border-line/60 pb-5">
        <div>
          <Eyebrow>Corpo</Eyebrow>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">Mapa de estímulo</h1>
        </div>
        <p className="text-xs text-ink-3">Últimos 7 dias</p>
      </header>

      {viviciState.carregando || perfilState.carregando || rotinasState.carregando ? (
        <Empty text="Carregando seu mapa de estímulo..." />
      ) : viviciState.erro || perfilState.erro || rotinasState.erro || !resultado ? (
        <Empty text="Não foi possível carregar a análise corporal agora." />
      ) : (
        <>
          <section aria-label="Mapa corporal interativo" className="py-7 sm:py-9">
            <MapaCorporal
              percentuais={resultado.percentuaisSemana}
              desequilibrios={resultado.desequilibrios}
              estatisticasPorGrupo={resultado.estatisticasPorGrupo}
              modoEditorial
            />
          </section>

          <Divider />

          <section aria-labelledby="titulo-grupos" className="py-8 sm:py-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Eyebrow>Leitura do período</Eyebrow>
                <h2 id="titulo-grupos" className="mt-2 text-xl font-semibold tracking-[-0.035em]">Grupos musculares</h2>
              </div>
              <Activity size={19} strokeWidth={1.5} className="text-ink-3" />
            </div>
            <div className="mt-6 divide-y divide-line/60 border-y border-line/60">
              {GRUPOS_MUSCULARES.map((grupo) => (
                <div key={grupo} className="grid min-h-12 grid-cols-[7.5rem_1fr_2.75rem] items-center gap-3 text-xs sm:grid-cols-[10rem_1fr_3rem]">
                  <span className="text-ink-2">{grupo}</span>
                  <div className="h-1 overflow-hidden bg-line/80">
                    <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${resultado.percentuaisSemana[grupo]}%` }} />
                  </div>
                  <span className="num text-right font-semibold">{resultado.percentuaisSemana[grupo]}%</span>
                </div>
              ))}
            </div>
          </section>

          {resultado.musculoNegligenciado && (
            <section className="border-t border-line/60 py-8">
              <Eyebrow>Atenção técnica</Eyebrow>
              <p className="mt-3 text-lg font-semibold tracking-[-0.025em]">{resultado.musculoNegligenciado.grupo}</p>
              <MetaText className="mt-1 max-w-xl">
                Está com {resultado.musculoNegligenciado.percentual}% do volume relativo de {resultado.musculoNegligenciado.grupoReferencia} no período recente.
              </MetaText>
            </section>
          )}
        </>
      )}
    </div>
  )
}
