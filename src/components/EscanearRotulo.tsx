import { useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Page } from './Page'
import { labelScannerService, type ResultadoScanRotulo } from '../lib/services/labelScannerService'
import { calcularConsumoPorPorcao, explicarRotulo } from '../lib/analiseRotulo'
import type { Refeicao } from '../lib/refeicoes'
import type { ItemDiario } from '../lib/diario'
import { capturarFotoNativa } from '../lib/cameraNativa'

function formatoBR(n: number): string {
  return Math.round(n).toLocaleString('pt-BR')
}

export function EscanearRotulo({
  refeicao,
  onFechar,
  onAdicionar,
}: {
  refeicao: Refeicao
  onFechar: () => void
  onAdicionar: (item: Omit<ItemDiario, 'id' | 'data' | 'refeicao'>) => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [analisando, setAnalisando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoScanRotulo | null>(null)
  const [gramas, setGramas] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function analisarArquivo(arquivo: File | undefined) {
    if (!arquivo) return
    setErro(null)
    setAnalisando(true)
    try {
      const r = await labelScannerService.escanearRotulo(arquivo)
      setResultado(r)
      setGramas(String(r.rotulo.porcaoG))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra ler o rótulo agora.')
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

  const gramasNum = Number(gramas.replace(',', '.'))
  const explicacao = resultado ? explicarRotulo(resultado.rotulo) : null
  const consumo = resultado && gramasNum > 0 ? calcularConsumoPorPorcao(resultado.rotulo, gramasNum) : null

  async function adicionarAoDiario() {
    if (!resultado || !consumo) return
    setEnviando(true)
    try {
      await onAdicionar({
        origem: 'rapida',
        nome: resultado.rotulo.produto,
        alimento_id: null,
        quantidade: gramasNum,
        kcal: consumo.kcalTotal,
        prot_g: consumo.proteinaTotal_g,
        carb_g: consumo.carbTotal_g,
        gord_g: consumo.gorduraTotal_g,
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Page title={`Escanear rótulo — ${refeicao}`}>
      <div className="mt-6">
        <input ref={inputRef} type="file" accept="image/*" onChange={escolherFoto} className="hidden" />

        {!resultado && !analisando && (
          <div className="rounded-2xl border border-line bg-card p-6 text-center">
            <p className="text-sm text-ink-2">
              Aponte a câmera pra tabela nutricional do rótulo, ou escolha uma foto já tirada.
            </p>
            <button
              onClick={abrirCamera}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              <Camera size={18} strokeWidth={1.75} />
              Escanear rótulo
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
            <p className="text-sm text-ink-2">Lendo a tabela nutricional...</p>
          </div>
        )}

        {erro && <p className="mt-4 text-sm text-down">{erro}</p>}

        {resultado && explicacao && !analisando && (
          <div className="animar-entrada space-y-5">
            <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
              <p className="text-xs text-gold">
                DEMONSTRAÇÃO — o VIVECI ainda não tem OCR conectado. O rótulo abaixo é um exemplo fixo. Confiança demonstrativa: {resultado.confiancaPercentual}%.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-[17px] font-semibold">{resultado.rotulo.produto}</h2>
              <p className="mt-1 text-xs text-ink-2">Porção: {resultado.rotulo.porcaoG}g</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <p className="text-ink-2">
                  Calorias <span className="num float-right text-ink">{resultado.rotulo.kcal} kcal</span>
                </p>
                <p className="text-ink-2">
                  Proteína <span className="num float-right text-ink">{resultado.rotulo.proteina_g}g</span>
                </p>
                <p className="text-ink-2">
                  Carboidratos <span className="num float-right text-ink">{resultado.rotulo.carb_g}g</span>
                </p>
                <p className="text-ink-2">
                  Açúcares <span className="num float-right text-ink">{resultado.rotulo.acucares_g}g</span>
                </p>
                <p className="text-ink-2">
                  Gorduras <span className="num float-right text-ink">{resultado.rotulo.gordura_g}g</span>
                </p>
                <p className="text-ink-2">
                  Gord. saturada <span className="num float-right text-ink">{resultado.rotulo.gordura_saturada_g}g</span>
                </p>
                <p className="text-ink-2">
                  Fibras <span className="num float-right text-ink">{resultado.rotulo.fibra_g}g</span>
                </p>
                <p className="text-ink-2">
                  Sódio <span className="num float-right text-ink">{resultado.rotulo.sodio_mg}mg</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-[17px] font-semibold">O que esse rótulo significa?</h2>
              <div className="mt-3 space-y-1.5 text-sm">
                <p className="text-ink-2">
                  Proteína: <span className="text-ink">{explicacao.proteina}</span>
                </p>
                <p className="text-ink-2">
                  Açúcar: <span className="text-ink">{explicacao.acucar}</span>
                </p>
                <p className="text-ink-2">
                  Sódio: <span className="text-ink">{explicacao.sodio}</span>
                </p>
                <p className="text-ink-2">
                  Calorias: <span className="text-ink">{explicacao.calorias}</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-[17px] font-semibold">Quanto você comeu?</h2>
              <input
                type="text"
                inputMode="decimal"
                value={gramas}
                onChange={(e) => setGramas(e.target.value)}
                className="mt-3 h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink focus:border-brand focus:outline-none"
              />
              {consumo && (
                <>
                  {consumo.alertaMultiplasPorcoes && (
                    <p className="mt-3 text-sm text-gold">
                      ⚠ Você consumiu aproximadamente {formatoBR(consumo.porcoesConsumidas)} porções.
                    </p>
                  )}
                  <p className="mt-3 text-sm text-ink">
                    Total: <span className="num font-semibold">{formatoBR(consumo.kcalTotal)} kcal</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-2">
                    P {formatoBR(consumo.proteinaTotal_g)}g · C {formatoBR(consumo.carbTotal_g)}g · G{' '}
                    {formatoBR(consumo.gorduraTotal_g)}g · Sódio {formatoBR(consumo.sodioTotal_mg)}mg
                  </p>
                </>
              )}
            </div>

            <button
              onClick={adicionarAoDiario}
              disabled={enviando || !consumo}
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
