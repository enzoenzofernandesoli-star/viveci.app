import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Sparkles } from 'lucide-react'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { AnalisarFisico } from '../components/AnalisarFisico'
import { useSessao } from '../lib/auth'
import { ANGULOS, useFotosProgresso, enviarFotoProgresso, type Angulo, type FotoProgresso } from '../lib/bodyScan'
import { useHistoricoTreinos } from '../lib/historicoTreinos'

function formatoData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

const JANELAS = [7, 30, 90] as const

function SlotAngulo({
  angulo,
  fotoHoje,
  onEnviar,
  enviando,
}: {
  angulo: Angulo
  fotoHoje: FotoProgresso | undefined
  onEnviar: (angulo: Angulo, arquivo: File) => void
  enviando: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={enviando}
        className="flex h-28 w-24 items-center justify-center overflow-hidden rounded-xl border border-line bg-card-hover disabled:opacity-60"
      >
        {fotoHoje ? (
          <img src={fotoHoje.url} alt={angulo} className="h-full w-full object-cover" />
        ) : (
          <Plus size={20} strokeWidth={1.75} className="text-ink-3" />
        )}
      </button>
      <span className="text-xs text-ink-2">{angulo}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0]
          e.target.value = ''
          if (arquivo) onEnviar(angulo, arquivo)
        }}
      />
    </div>
  )
}

export default function BodyScan() {
  const { sessao } = useSessao()
  const navigate = useNavigate()
  const userId = sessao?.user.id
  const { fotos, carregando, erro, recarregar } = useFotosProgresso(userId)
  const { treinos } = useHistoricoTreinos(userId, 200)
  const [enviandoAngulo, setEnviandoAngulo] = useState<Angulo | null>(null)
  const [janela, setJanela] = useState<(typeof JANELAS)[number]>(30)
  const [comparando, setComparando] = useState(false)
  const [dataA, setDataA] = useState<string | null>(null)
  const [dataB, setDataB] = useState<string | null>(null)
  const [anguloComparacao, setAnguloComparacao] = useState<Angulo>('Frente')
  const [analisandoFisico, setAnalisandoFisico] = useState(false)

  if (!sessao || !userId) {
    return (
      <Page title="Body Scan">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  async function enviar(angulo: Angulo, arquivo: File) {
    setEnviandoAngulo(angulo)
    try {
      await enviarFotoProgresso(userId!, angulo, arquivo)
      recarregar()
    } finally {
      setEnviandoAngulo(null)
    }
  }

  if (analisandoFisico) {
    return (
      <AnalisarFisico
        onFechar={() => setAnalisandoFisico(false)}
        onSalvarFoto={async (arquivo) => {
          await enviarFotoProgresso(userId, 'Frente', arquivo)
          recarregar()
          setAnalisandoFisico(false)
        }}
      />
    )
  }

  const hoje = hojeISO()
  const fotosHoje = ANGULOS.map((a) => fotos.find((f) => f.data === hoje && f.angulo === a))

  const limiteJanela = new Date()
  limiteJanela.setDate(limiteJanela.getDate() - janela)
  const fotosNaJanela = fotos.filter((f) => new Date(f.data) >= limiteJanela)

  const datasComFoto = [...new Set(fotos.filter((f) => f.angulo === anguloComparacao).map((f) => f.data))].sort()
  const fotoA = dataA ? fotos.find((f) => f.angulo === anguloComparacao && f.data === dataA) : null
  const fotoB = dataB ? fotos.find((f) => f.angulo === anguloComparacao && f.data === dataB) : null

  const treinosNoPeriodo =
    dataA && dataB
      ? treinos.filter((t) => t.finalizadaEm.slice(0, 10) >= dataA && t.finalizadaEm.slice(0, 10) <= dataB).length
      : 0

  return (
    <div className="animar-entrada pb-4">
      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => navigate('/perfil')} aria-label="Voltar" className="text-ink-2 hover:text-ink">
          <ChevronLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Body Scan</h1>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-card p-6">
        <h2 className="text-[17px] font-semibold">Fotos de hoje</h2>
        <div className="mt-4 flex justify-around">
          {ANGULOS.map((angulo, i) => (
            <SlotAngulo
              key={angulo}
              angulo={angulo}
              fotoHoje={fotosHoje[i]}
              onEnviar={enviar}
              enviando={enviandoAngulo === angulo}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center gap-2">
          <Sparkles size={18} strokeWidth={1.75} className="text-brand" />
          <h2 className="text-[17px] font-semibold">Analisar meu físico</h2>
        </div>
        <p className="mt-2 text-sm text-ink-2">
          Receba uma pontuação de potencial, definição, simetria, V-taper e massa muscular a partir de uma foto.
        </p>
        <button
          onClick={() => setAnalisandoFisico(true)}
          className="mt-4 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Começar análise
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold">Histórico</h2>
        <div className="flex gap-2">
          {JANELAS.map((j) => (
            <button
              key={j}
              onClick={() => setJanela(j)}
              className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                janela === j ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
              }`}
            >
              {j}d
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        {carregando ? (
          <Empty text="Carregando fotos..." />
        ) : erro ? (
          <Empty text="Não deu pra carregar suas fotos." />
        ) : fotosNaJanela.length === 0 ? (
          <Empty text="Nenhuma foto nesse período ainda." />
        ) : (
          <div className="space-y-3">
            {fotosNaJanela.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3">
                <img src={f.url} alt={f.angulo} className="h-14 w-12 rounded-lg object-cover" />
                <div>
                  <p className="text-sm text-ink">{f.angulo}</p>
                  <p className="text-xs text-ink-2">{formatoData(f.data)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setComparando((v) => !v)}
        className="mt-5 h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
      >
        {comparando ? 'Fechar comparação' : 'Comparar evolução'}
      </button>

      {comparando && (
        <div className="animar-entrada mt-4 rounded-2xl border border-line bg-card p-6">
          <div className="flex gap-2">
            {ANGULOS.map((a) => (
              <button
                key={a}
                onClick={() => setAnguloComparacao(a)}
                className={`h-9 flex-1 rounded-xl text-xs font-semibold transition-colors ${
                  anguloComparacao === a ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          {datasComFoto.length < 2 ? (
            <p className="mt-4 text-sm text-ink-2">
              Precisa de pelo menos 2 fotos desse ângulo em datas diferentes pra comparar.
            </p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">De</label>
                  <select
                    value={dataA ?? ''}
                    onChange={(e) => setDataA(e.target.value || null)}
                    className="h-10 w-full rounded-xl border border-line bg-card-hover px-2 text-xs text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="">Escolher</option>
                    {datasComFoto.map((d) => (
                      <option key={d} value={d}>
                        {formatoData(d)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Até</label>
                  <select
                    value={dataB ?? ''}
                    onChange={(e) => setDataB(e.target.value || null)}
                    className="h-10 w-full rounded-xl border border-line bg-card-hover px-2 text-xs text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="">Escolher</option>
                    {datasComFoto.map((d) => (
                      <option key={d} value={d}>
                        {formatoData(d)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {fotoA && fotoB && (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <img src={fotoA.url} alt="Antes" className="w-full rounded-xl object-cover" />
                    <img src={fotoB.url} alt="Depois" className="w-full rounded-xl object-cover" />
                  </div>
                  <p className="mt-3 text-center text-xs text-ink-2">
                    {treinosNoPeriodo} {treinosNoPeriodo === 1 ? 'treino concluído' : 'treinos concluídos'} nesse
                    período.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
