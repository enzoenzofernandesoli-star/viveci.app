import { useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Page } from './Page'
import { foodScannerService, type ResultadoScanRefeicao } from '../lib/services/foodScannerService'
import { aplicarAjusteQuantidade, avaliarRefeicao, somarItens, type AjusteQuantidade } from '../lib/analiseRefeicao'
import type { Refeicao } from '../lib/refeicoes'
import type { ItemDiario } from '../lib/diario'
import { capturarFotoNativa } from '../lib/cameraNativa'

function formatoBR(n: number): string {
  return Math.round(n).toLocaleString('pt-BR')
}

const AJUSTES: { valor: AjusteQuantidade; label: string }[] = [
  { valor: 'pouco', label: 'Pouco' },
  { valor: 'medio', label: 'Médio' },
  { valor: 'muito', label: 'Muito' },
]

export function EscanearRefeicao({
  refeicao,
  onFechar,
  onAdicionarTodos,
}: {
  refeicao: Refeicao
  onFechar: () => void
  onAdicionarTodos: (itens: Omit<ItemDiario, 'id' | 'data' | 'refeicao'>[]) => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [analisando, setAnalisando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoScanRefeicao | null>(null)
  const [ajustes, setAjustes] = useState<Record<number, AjusteQuantidade>>({})
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function analisarArquivo(arquivo: File | undefined) {
    if (!arquivo) return
    setErro(null)
    setAnalisando(true)
    try {
      const r = await foodScannerService.analisarFoto(arquivo)
      setResultado(r)
      setAjustes({})
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra analisar a foto agora.')
    } finally {
      setAnalisando(false)
    }
  }

  function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    void analisarArquivo(arquivo)
  }

  async function abrirCamera() {
    try {
      const foto = await capturarFotoNativa()
      if (foto === undefined) inputRef.current?.click()
      else if (foto) await analisarArquivo(foto)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível abrir a câmera.')
    }
  }

  const itensAjustados = resultado?.itens.map((item, i) => aplicarAjusteQuantidade(item, ajustes[i] ?? 'medio')) ?? []
  const totais = somarItens(itensAjustados)
  const avaliacao = itensAjustados.length > 0 ? avaliarRefeicao(totais) : null

  async function adicionarAoDiario() {
    setEnviando(true)
    try {
      await onAdicionarTodos(
        itensAjustados.map((item) => ({
          origem: 'rapida' as const,
          nome: item.nome,
          alimento_id: null,
          quantidade: item.quantidadeEstimadaG,
          kcal: item.kcal,
          prot_g: item.prot_g,
          carb_g: item.carb_g,
          gord_g: item.gord_g,
        })),
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Page title={`Escanear refeição — ${refeicao}`}>
      <div className="mt-6">
        <input ref={inputRef} type="file" accept="image/*" onChange={escolherFoto} className="hidden" />

        {!resultado && !analisando && (
          <div className="rounded-2xl border border-line bg-card p-6 text-center">
            <p className="text-sm text-ink-2">
              Tire uma foto do prato ou escolha uma imagem. O VIVECI estima os alimentos e as calorias.
            </p>
            <button
              onClick={abrirCamera}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              <Camera size={18} strokeWidth={1.75} />
              Tirar foto
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
            >
              <Upload size={16} strokeWidth={1.75} />
              Escolher da galeria
            </button>
          </div>
        )}

        {analisando && (
          <div className="animar-entrada rounded-2xl border border-line bg-card px-6 py-12 text-center">
            <span className="mx-auto mb-3 block h-2 w-2 rounded-full bg-brand animar-pulso" />
            <p className="text-sm text-ink-2">Analisando sua refeição...</p>
          </div>
        )}

        {erro && <p className="mt-4 text-sm text-down">{erro}</p>}

        {resultado && !analisando && (
          <div className="animar-entrada space-y-5">
            <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
              <p className="text-xs text-gold">
                DEMONSTRAÇÃO — o VIVECI ainda não tem uma IA de visão conectada. O resultado abaixo é um exemplo fixo. Confiança demonstrativa:{' '}
                {resultado.confiancaPercentual}%.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-[17px] font-semibold">Alimentos identificados</h2>
              <div className="mt-4 space-y-4">
                {itensAjustados.map((item, i) => (
                  <div key={item.nome} className="border-b border-line pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">{item.nome}</p>
                      <p className="num text-sm text-ink-2">≈ {formatoBR(item.kcal)} kcal</p>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {AJUSTES.map(({ valor, label }) => (
                        <button
                          key={valor}
                          onClick={() => setAjustes((a) => ({ ...a, [i]: valor }))}
                          className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                            (ajustes[i] ?? 'medio') === valor ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-card-hover px-4 py-3">
                <p className="text-sm text-ink">
                  <span className="text-ink-2">Total estimado:</span>{' '}
                  <span className="num font-semibold">{formatoBR(totais.kcal)} kcal</span>
                </p>
                <p className="mt-1 text-xs text-ink-2">
                  P {formatoBR(totais.prot_g)}g · C {formatoBR(totais.carb_g)}g · G {formatoBR(totais.gord_g)}g
                </p>
              </div>
            </div>

            {avaliacao && (
              <div className="rounded-2xl border border-line bg-card p-6">
                <h2 className="text-[17px] font-semibold">Como posso melhorar?</h2>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-ink-2">
                    Proteína: <span className="text-ink">{avaliacao.proteina}</span>
                  </p>
                  <p className="text-ink-2">
                    Carboidratos: <span className="text-ink">{avaliacao.carboidratos}</span>
                  </p>
                  <p className="text-ink-2">
                    Fibras: <span className="text-ink">{avaliacao.fibras}</span>
                  </p>
                </div>
                {avaliacao.sugestoes.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {avaliacao.sugestoes.map((s) => (
                      <li key={s} className="text-sm text-ink-2">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              onClick={adicionarAoDiario}
              disabled={enviando}
              className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {enviando ? 'Adicionando...' : 'Adicionar ao diário'}
            </button>
          </div>
        )}

        <button
          onClick={onFechar}
          className="mt-4 h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
        >
          Cancelar
        </button>
      </div>
    </Page>
  )
}
