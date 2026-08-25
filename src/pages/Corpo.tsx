import { useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { Empty } from '../components/Empty'
import { MapaCorporal } from '../components/MapaCorporal'
import { PainelRankCorporal } from '../components/RankCorporal'
import { Divider } from '../components/ui/Surface'
import { Eyebrow, MetaText } from '../components/ui/Typography'
import { useSessao } from '../lib/auth'
import { exportarResumoCorporal } from '../lib/exportarResumoCorporal'
import { GRUPOS_MUSCULARES } from '../lib/mapaCorporal'
import { usePerfil } from '../lib/perfil'
import { calcularRankCorporal } from '../lib/rankCorporal'
import { useRotinas } from '../lib/rotinas'
import { useVivici } from '../lib/vivici'

export default function Corpo() {
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [erroExportacao, setErroExportacao] = useState<string | null>(null)
  const mapaRef = useRef<HTMLElement>(null)
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
  const gruposOrdenados = resultado
    ? [...GRUPOS_MUSCULARES].sort((a, b) => resultado.percentuaisSemana[b] - resultado.percentuaisSemana[a])
    : []
  const semEstimulos = resultado ? gruposOrdenados.every((grupo) => resultado.percentuaisSemana[grupo] === 0) : false
  const gruposVisiveis = mostrarTodos ? gruposOrdenados : gruposOrdenados.slice(0, 5)
  const rank = resultado ? calcularRankCorporal(resultado.percentuaisSemana) : null

  async function salvarImagem() {
    const mapaSvg = mapaRef.current?.querySelector('svg')
    if (!resultado || !rank || !mapaSvg) {
      setErroExportacao('O mapa ainda não está pronto para ser salvo.')
      return
    }
    setExportando(true)
    setErroExportacao(null)
    try {
      await exportarResumoCorporal({
        nome: perfilState.perfil?.nome ?? 'Atleta VIVECI',
        rank,
        percentuais: resultado.percentuaisSemana,
        mapaSvg,
      })
    } catch (erro) {
      setErroExportacao(erro instanceof Error ? erro.message : 'Não foi possível salvar a imagem.')
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="animar-entrada mx-auto w-full max-w-[1120px]">
      <header className="flex items-end justify-between gap-4 border-b border-line/60 pb-4">
        <div>
          <Eyebrow>Corpo</Eyebrow>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">Mapa de estímulo</h1>
          <p className="mt-1 text-xs text-ink-3">Últimos 7 dias</p>
        </div>
        {resultado && (
          <button type="button" onClick={salvarImagem} disabled={exportando} className="flex min-h-11 items-center gap-2 text-xs font-semibold text-ink-2 hover:text-ink disabled:opacity-50">
            <Download size={17} strokeWidth={1.75} />
            {exportando ? 'Gerando...' : 'Salvar imagem'}
          </button>
        )}
      </header>
      {erroExportacao && <p role="alert" className="mt-3 text-xs text-down">{erroExportacao}</p>}

      {viviciState.carregando || perfilState.carregando || rotinasState.carregando ? (
        <Empty text="Carregando seu mapa de estímulo..." />
      ) : viviciState.erro || perfilState.erro || rotinasState.erro || !resultado ? (
        <Empty text="Não foi possível carregar a análise corporal agora." />
      ) : (
        <>
          {rank && <PainelRankCorporal rank={rank} />}

          <section ref={mapaRef} aria-label="Mapa corporal interativo" className="py-4 sm:py-7">
            <MapaCorporal
              percentuais={resultado.percentuaisSemana}
              desequilibrios={resultado.desequilibrios}
              estatisticasPorGrupo={resultado.estatisticasPorGrupo}
              modoEditorial
            />
          </section>

          {semEstimulos && (
            <section className="border-y border-line/60 py-6 text-center">
              <Eyebrow>Sem estímulos recentes</Eyebrow>
              <MetaText className="mt-2">Seus treinos dos últimos 7 dias aparecerão aqui.</MetaText>
            </section>
          )}

          <Divider />

          <section aria-labelledby="titulo-grupos" className="py-8 sm:py-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Eyebrow>Leitura do período</Eyebrow>
                <h2 id="titulo-grupos" className="mt-2 text-xl font-semibold tracking-[-0.035em]">Grupos musculares</h2>
              </div>
              {gruposOrdenados.length > 5 && <button onClick={() => setMostrarTodos((valor) => !valor)} className="min-h-11 text-xs font-semibold text-ink-2 hover:text-ink">{mostrarTodos ? 'Mostrar menos' : 'Ver todos'}</button>}
            </div>
            <div className="mt-6 divide-y divide-line/60 border-y border-line/60">
              {gruposVisiveis.map((grupo) => (
                <div key={grupo} className="grid min-h-12 grid-cols-[7.5rem_1fr] items-center gap-3 text-xs sm:grid-cols-[10rem_1fr]">
                  <span className="text-ink-2">{grupo}</span>
                  <div className="h-1 overflow-hidden bg-line/80">
                    <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${resultado.percentuaisSemana[grupo]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {resultado.musculoNegligenciado && (
            <section className="border-t border-line/60 py-8">
              <Eyebrow>Atenção</Eyebrow>
              <p className="mt-3 text-lg font-semibold tracking-[-0.025em]">{resultado.musculoNegligenciado.grupo}</p>
              <MetaText className="mt-1 max-w-xl">
                Menor estímulo relativo no período recente, comparado a {resultado.musculoNegligenciado.grupoReferencia}.
              </MetaText>
            </section>
          )}
        </>
      )}
    </div>
  )
}
