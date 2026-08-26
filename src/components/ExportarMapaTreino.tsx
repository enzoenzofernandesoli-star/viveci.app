import { useRef, useState } from 'react'
import { Camera, Download, X } from 'lucide-react'
import { calcularRankCorporal } from '../lib/rankCorporal'
import { exportarResumoCorporal } from '../lib/exportarResumoCorporal'
import { POSICOES_RESUMO, type PosicaoResumoCorporal } from '../lib/posicaoResumoCorporal'
import { detectarDesequilibrios, type PercentualPorGrupo } from '../lib/mapaCorporal'
import { TAMANHO_MAX_PROGRESSO, validarImagem } from '../lib/uploadSeguro'
import { MapaCorporal } from './MapaCorporal'
import { Modal } from './Modal'

export function ExportarMapaTreino({ percentuais }: { percentuais: PercentualPorGrupo }) {
  const [fotoPendente, setFotoPendente] = useState<File | null>(null)
  const [exportando, setExportando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const mapaRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const rank = calcularRankCorporal(percentuais)

  async function salvar(fotoFundo?: File, posicao: PosicaoResumoCorporal = 'inferior-esquerdo') {
    const mapaSvg = mapaRef.current?.querySelector('svg')
    if (!mapaSvg) {
      setErro('O mapa ainda não está pronto para ser salvo.')
      return
    }
    setExportando(true)
    setErro(null)
    try {
      await exportarResumoCorporal({ rank, mapaSvg, fotoFundo, posicao })
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar a imagem.')
    } finally {
      setExportando(false)
    }
  }

  function receberFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const foto = evento.target.files?.[0]
    evento.target.value = ''
    if (!foto) return
    try {
      validarImagem(foto, TAMANHO_MAX_PROGRESSO)
      setErro(null)
      setFotoPendente(foto)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível usar essa foto.')
    }
  }

  async function escolherPosicao(posicao: PosicaoResumoCorporal) {
    if (!fotoPendente) return
    const foto = fotoPendente
    setFotoPendente(null)
    await salvar(foto, posicao)
  }

  return (
    <section className="mt-8 border-y border-line/60 py-6 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Estímulos deste treino</p>
      <p className="mt-2 text-sm text-ink-2">Salve o mapa sozinho ou coloque-o sobre uma foto tirada agora.</p>

      <div ref={mapaRef} className="mx-auto mt-4 max-w-64">
        <MapaCorporal percentuais={percentuais} desequilibrios={detectarDesequilibrios(percentuais)} />
      </div>

      {erro && <p role="alert" className="mt-3 text-xs text-down">{erro}</p>}
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => salvar()} disabled={exportando} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-xs font-semibold text-white disabled:opacity-50">
          <Download size={17} strokeWidth={1.75} /> {exportando ? 'Gerando...' : 'Salvar mapa de estímulo'}
        </button>
        <button type="button" onClick={() => cameraRef.current?.click()} disabled={exportando} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line px-4 text-xs font-semibold text-ink disabled:opacity-50">
          <Camera size={17} strokeWidth={1.75} /> Tirar foto com o mapa
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={receberFoto} className="hidden" />

      {fotoPendente && (
        <Modal fechar={() => setFotoPendente(null)} rotulo="Escolher posição do mapa de estímulo">
          <div className="animar-escala w-full max-w-sm rounded-2xl border border-line bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Posição na foto</p><h2 className="mt-1 text-xl font-semibold">Onde fica o mapa?</h2></div>
              <button type="button" onClick={() => setFotoPendente(null)} aria-label="Fechar" className="flex size-11 items-center justify-center text-ink-2"><X size={20} /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {POSICOES_RESUMO.map((item) => (
                <button key={item.valor} type="button" onClick={() => escolherPosicao(item.valor)} className={`relative min-h-20 rounded-xl border border-line bg-app text-[11px] font-semibold text-ink-2 ${item.valor === 'centro' ? 'col-span-2' : ''}`}>
                  <span className={`absolute h-5 w-3 rounded-sm bg-brand ${item.valor === 'superior-esquerdo' ? 'left-3 top-3' : item.valor === 'superior-direito' ? 'right-3 top-3' : item.valor === 'inferior-esquerdo' ? 'bottom-3 left-3' : item.valor === 'inferior-direito' ? 'bottom-3 right-3' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}`} />
                  <span className="absolute inset-x-2 bottom-2">{item.nome}</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}
