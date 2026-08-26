import { useRef, useState } from 'react'
import { Camera, Download, X } from 'lucide-react'
import type { PercentualPorGrupo } from '../lib/mapaCorporal'
import type { RankCorporal } from '../lib/rankCorporal'
import { exportarResumoCorporal } from '../lib/exportarResumoCorporal'
import { POSICOES_RESUMO, type PosicaoResumoCorporal } from '../lib/posicaoResumoCorporal'
import { TAMANHO_MAX_PROGRESSO, validarImagem } from '../lib/uploadSeguro'
import { MapaCorporal } from './MapaCorporal'
import { Modal } from './Modal'
import { capturarFotoNativa } from '../lib/cameraNativa'

type AcaoPendente = { tipo: 'salvar' } | { tipo: 'foto'; arquivo: File }

export function AcoesExportarMapa({
  percentuais,
  rank,
  onErro,
}: {
  percentuais: PercentualPorGrupo
  rank: RankCorporal
  onErro?: (erro: string | null) => void
}) {
  const [acao, setAcao] = useState<AcaoPendente | null>(null)
  const [fotoComCostas, setFotoComCostas] = useState<{ arquivo: File; incluirCostas: boolean } | null>(null)
  const [exportando, setExportando] = useState(false)
  const frenteRef = useRef<HTMLDivElement>(null)
  const costasRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  async function salvar(incluirCostas: boolean, fotoFundo?: File, posicao: PosicaoResumoCorporal = 'inferior-esquerdo') {
    const mapaSvg = frenteRef.current?.querySelector('svg')
    const mapaCostasSvg = incluirCostas ? (costasRef.current?.querySelector('svg') ?? undefined) : undefined
    if (!mapaSvg || (incluirCostas && !mapaCostasSvg)) {
      onErro?.('O mapa ainda não está pronto para ser salvo.')
      return
    }
    setExportando(true)
    onErro?.(null)
    try {
      await exportarResumoCorporal({ rank, mapaSvg, mapaCostasSvg, fotoFundo, posicao })
    } catch (falha) {
      onErro?.(falha instanceof Error ? falha.message : 'Não foi possível salvar a imagem.')
    } finally {
      setExportando(false)
    }
  }

  function aplicarFoto(arquivo: File | undefined) {
    if (!arquivo) return
    try {
      validarImagem(arquivo, TAMANHO_MAX_PROGRESSO)
      onErro?.(null)
      setAcao({ tipo: 'foto', arquivo })
    } catch (falha) {
      onErro?.(falha instanceof Error ? falha.message : 'Não foi possível usar essa foto.')
    }
  }

  function receberFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    aplicarFoto(arquivo)
  }

  async function abrirCamera() {
    try {
      const foto = await capturarFotoNativa()
      if (foto === undefined) cameraRef.current?.click()
      else if (foto) aplicarFoto(foto)
    } catch (falha) {
      onErro?.(falha instanceof Error ? falha.message : 'Não foi possível abrir a câmera.')
    }
  }

  async function escolherVisao(incluirCostas: boolean) {
    if (!acao) return
    const atual = acao
    setAcao(null)
    if (atual.tipo === 'foto') {
      setFotoComCostas({ arquivo: atual.arquivo, incluirCostas })
      return
    }
    await salvar(incluirCostas)
  }

  async function escolherPosicao(posicao: PosicaoResumoCorporal) {
    if (!fotoComCostas) return
    const atual = fotoComCostas
    setFotoComCostas(null)
    await salvar(atual.incluirCostas, atual.arquivo, posicao)
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setAcao({ tipo: 'salvar' })} disabled={exportando} className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-action)] bg-brand px-4 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
          <Download size={17} strokeWidth={1.75} /> {exportando ? 'Gerando...' : 'Salvar mapa de estímulo'}
        </button>
        <button type="button" onClick={abrirCamera} disabled={exportando} className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-action)] border border-line px-4 text-xs font-semibold text-ink hover:bg-card-hover disabled:opacity-50">
          <Camera size={17} strokeWidth={1.75} /> Tirar foto com o mapa
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={receberFoto} className="hidden" />

      <div aria-hidden="true" className="pointer-events-none fixed -left-[10000px] top-0 w-72 opacity-0">
        <div ref={frenteRef}><MapaCorporal percentuais={percentuais} desequilibrios={[]} vistaInicial="frente" vistaFixa /></div>
        <div ref={costasRef}><MapaCorporal percentuais={percentuais} desequilibrios={[]} vistaInicial="costas" vistaFixa /></div>
      </div>

      {acao && (
        <Modal fechar={() => setAcao(null)} rotulo="Escolher visões do mapa de estímulo">
          <div className="animar-escala w-full max-w-sm rounded-[var(--radius-media)] border border-line bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Visões do corpo</p><h2 className="mt-1 text-xl font-semibold">O que deseja mostrar?</h2><p className="mt-1 text-xs text-ink-2">A frente sempre aparece. Você pode incluir as costas ao lado.</p></div>
              <button type="button" onClick={() => setAcao(null)} aria-label="Fechar" className="flex size-11 shrink-0 items-center justify-center text-ink-2"><X size={20} /></button>
            </div>
            <div className="mt-5 grid gap-2">
              <button type="button" onClick={() => escolherVisao(false)} className="min-h-16 rounded-xl border border-line bg-app px-4 text-left transition-colors hover:border-brand/60"><span className="block text-sm font-semibold text-ink">Somente frente</span><span className="mt-1 block text-xs text-ink-2">Um mapa corporal maior.</span></button>
              <button type="button" onClick={() => escolherVisao(true)} className="min-h-16 rounded-xl border border-line bg-app px-4 text-left transition-colors hover:border-brand/60"><span className="block text-sm font-semibold text-ink">Frente + costas</span><span className="mt-1 block text-xs text-ink-2">Os dois mapas lado a lado.</span></button>
            </div>
          </div>
        </Modal>
      )}

      {fotoComCostas && (
        <Modal fechar={() => setFotoComCostas(null)} rotulo="Escolher posição do mapa de estímulo">
          <div className="animar-escala w-full max-w-sm rounded-[var(--radius-media)] border border-line bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Posição na foto</p><h2 className="mt-1 text-xl font-semibold">Onde fica o mapa?</h2></div>
              <button type="button" onClick={() => setFotoComCostas(null)} aria-label="Fechar" className="flex size-11 items-center justify-center text-ink-2"><X size={20} /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {POSICOES_RESUMO.map((item) => (
                <button key={item.valor} type="button" onClick={() => escolherPosicao(item.valor)} className={`relative min-h-20 rounded-xl border border-line bg-app text-[11px] font-semibold text-ink-2 hover:border-brand/60 ${item.valor === 'centro' ? 'col-span-2' : ''}`}>
                  <span className={`absolute h-5 w-3 rounded-sm bg-brand ${item.valor === 'superior-esquerdo' ? 'left-3 top-3' : item.valor === 'superior-direito' ? 'right-3 top-3' : item.valor === 'inferior-esquerdo' ? 'bottom-3 left-3' : item.valor === 'inferior-direito' ? 'bottom-3 right-3' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}`} />
                  <span className="absolute inset-x-2 bottom-2">{item.nome}</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
