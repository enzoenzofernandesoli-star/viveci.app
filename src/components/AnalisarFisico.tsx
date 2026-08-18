import { useEffect, useRef, useState } from 'react'
import { PersonStanding, Shirt, Sun, Camera, Upload } from 'lucide-react'
import { Page } from './Page'
import { physiqueScoreService, type ResultadoAnaliseFisico, type PontuacaoFisico } from '../lib/services/physiqueScoreService'

type Etapa = 'instrucoes' | 'foto' | 'analisando' | 'resultado'

const INSTRUCOES = [
  { Icone: PersonStanding, texto: 'Fique a alguns metros de distância, corpo inteiro visível.' },
  { Icone: Shirt, texto: 'Vista roupa confortável e mínima, sem casaco largo por cima.' },
  { Icone: Sun, texto: 'Use boa iluminação, de frente pra luz.' },
]

const CAMPOS_PONTUACAO: { chave: keyof PontuacaoFisico; label: string }[] = [
  { chave: 'potencial', label: 'Potencial' },
  { chave: 'definicao', label: 'Definição' },
  { chave: 'simetria', label: 'Simetria' },
  { chave: 'vTaper', label: 'V-Taper' },
  { chave: 'massaMuscular', label: 'Massa muscular' },
]

function BarraPontuacao({ label, valor, atraso }: { label: string; valor: number; atraso: number }) {
  const [cheio, setCheio] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setCheio(true), 60)
    return () => clearTimeout(id)
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-2">{label}</span>
        <span className="num text-ink">{valor}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-card-hover">
        <div
          className="h-1.5 rounded-full bg-brand transition-[width] duration-700 ease-out"
          style={{ width: `${cheio ? valor : 0}%`, transitionDelay: `${atraso}ms` }}
        />
      </div>
    </div>
  )
}

export function AnalisarFisico({
  onFechar,
  onSalvarFoto,
}: {
  onFechar: () => void
  onSalvarFoto: (arquivo: File) => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [etapa, setEtapa] = useState<Etapa>('instrucoes')
  const [passoInstrucao, setPassoInstrucao] = useState(0)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoAnaliseFisico | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setArquivo(f)
    setPreview(URL.createObjectURL(f))
  }

  async function analisar() {
    if (!arquivo) return
    setEtapa('analisando')
    setErro(null)
    try {
      const r = await physiqueScoreService.analisarFisico(arquivo)
      setResultado(r)
      setEtapa('resultado')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra analisar a foto agora.')
      setEtapa('foto')
    }
  }

  async function salvarFoto() {
    if (!arquivo) return
    setSalvando(true)
    try {
      await onSalvarFoto(arquivo)
    } finally {
      setSalvando(false)
    }
  }

  if (etapa === 'instrucoes') {
    const { Icone, texto } = INSTRUCOES[passoInstrucao]
    return (
      <Page title="Analisar meu físico">
        <div className="animar-entrada mt-6 rounded-2xl border border-line bg-card p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Icone size={36} strokeWidth={1.5} />
          </div>
          <p className="mt-6 text-[17px] font-semibold text-ink">{texto}</p>

          <div className="mt-6 flex justify-center gap-1.5">
            {INSTRUCOES.map((_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-full ${i === passoInstrucao ? 'bg-brand' : 'bg-card-hover'}`} />
            ))}
          </div>

          <button
            onClick={() => (passoInstrucao < INSTRUCOES.length - 1 ? setPassoInstrucao((p) => p + 1) : setEtapa('foto'))}
            className="mt-8 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            {passoInstrucao < INSTRUCOES.length - 1 ? 'Próximo' : 'Continuar'}
          </button>
        </div>
        <button
          onClick={onFechar}
          className="mt-4 h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
        >
          Cancelar
        </button>
      </Page>
    )
  }

  if (etapa === 'foto') {
    return (
      <Page title="Analisar meu físico">
        <div className="animar-entrada mt-6">
          <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={escolherFoto} className="hidden" />

          {preview ? (
            <div className="rounded-2xl border border-line bg-card p-4">
              <img src={preview} alt="Prévia" className="mx-auto max-h-96 w-auto rounded-xl object-contain" />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setArquivo(null)
                    setPreview(null)
                  }}
                  className="h-11 flex-1 rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
                >
                  Trocar foto
                </button>
                <button
                  onClick={analisar}
                  className="h-11 flex-1 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  Usar esta foto
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-card p-6 text-center">
              <p className="text-sm text-ink-2">Tire uma foto ou escolha da galeria, seguindo as instruções.</p>
              <button
                onClick={() => inputRef.current?.click()}
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

          {erro && <p className="mt-4 text-sm text-down">{erro}</p>}

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

  if (etapa === 'analisando') {
    return (
      <Page title="Analisar meu físico">
        <div className="animar-entrada mt-6 rounded-2xl border border-line bg-card px-6 py-16 text-center">
          {preview && <img src={preview} alt="" className="mx-auto mb-6 h-40 w-32 rounded-xl object-cover opacity-40 blur-sm" />}
          <span className="mx-auto mb-3 block h-2 w-2 rounded-full bg-brand animar-pulso" />
          <p className="text-sm text-ink-2">Analisando seu físico...</p>
        </div>
      </Page>
    )
  }

  if (etapa === 'resultado' && resultado) {
    return (
      <Page title="Resultado">
        <div className="animar-entrada mt-6 space-y-5">
          <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
            <p className="text-xs text-gold">
              DEMONSTRAÇÃO — o VIVECI ainda não tem uma IA de análise corporal conectada. Esses números são fixos e servem apenas para demonstrar a interface,
              não uma medição real da sua foto. Confiança: {resultado.confiancaPercentual}%.
            </p>
          </div>

          <div className="border-y border-line/60 py-6">
            <div className="flex gap-4">
              {preview && <img src={preview} alt="" className="h-32 w-24 shrink-0 rounded-xl object-cover" />}
              <div className="flex-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2">Demonstração — não é análise real</span>
                <p className="num animar-escala text-[52px] font-semibold leading-none tracking-[-0.06em] text-brand">{resultado.pontuacao.overall}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {CAMPOS_PONTUACAO.map(({ chave, label }, i) => (
                <BarraPontuacao key={chave} label={label} valor={resultado.pontuacao[chave]} atraso={i * 60} />
              ))}
            </div>
          </div>

          <button
            onClick={salvarFoto}
            disabled={salvando}
            className="h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Salvar foto de progresso'}
          </button>
          <button
            onClick={onFechar}
            className="h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
          >
            Fechar
          </button>
        </div>
      </Page>
    )
  }

  return null
}
