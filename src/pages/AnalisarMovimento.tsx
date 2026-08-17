import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Video } from 'lucide-react'
import { Empty } from '../components/Empty'
import { EXERCICIOS } from '../data/exercicios'
import { movementAnalysisService } from '../lib/services/movementAnalysisService'

export default function AnalisarMovimento() {
  const { exercicioId } = useParams<{ exercicioId: string }>()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [analisando, setAnalisando] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const exercicio = exercicioId ? EXERCICIOS.find((e) => e.id === Number(exercicioId)) : undefined

  if (!exercicio) {
    return (
      <div className="animar-entrada pb-4">
        <div className="mt-6 flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Voltar" className="text-ink-2 hover:text-ink">
            <ChevronLeft size={22} strokeWidth={1.75} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Analisar movimento</h1>
        </div>
        <div className="mt-6">
          <Empty text="Exercício não encontrado." />
        </div>
      </div>
    )
  }

  async function escolherVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    setErro(null)
    setAnalisando(true)
    try {
      const r = await movementAnalysisService.analisarVideo(arquivo, exercicio!.nome)
      setFeedback(r.feedback)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra analisar o vídeo agora.')
    } finally {
      setAnalisando(false)
    }
  }

  return (
    <div className="animar-entrada pb-4">
      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="text-ink-2 hover:text-ink">
          <ChevronLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Analisar movimento</h1>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-card p-6 text-center">
        <img src={exercicio.gif} alt={exercicio.nome} className="mx-auto h-32 w-32 rounded-xl object-contain" />
        <p className="mt-3 text-[17px] font-semibold text-ink">{exercicio.nome}</p>

        {!feedback && !analisando && (
          <>
            <p className="mt-2 text-sm text-ink-2">
              Grave ou envie um vídeo curto executando o movimento pra receber feedback.
            </p>
            <input ref={inputRef} type="file" accept="video/*,image/*" capture="environment" onChange={escolherVideo} className="hidden" />
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              <Video size={18} strokeWidth={1.75} />
              Gravar ou enviar vídeo
            </button>
          </>
        )}

        {analisando && (
          <div className="mt-5">
            <span className="mx-auto mb-3 block h-2 w-2 rounded-full bg-brand animar-pulso" />
            <p className="text-sm text-ink-2">Analisando o movimento...</p>
          </div>
        )}

        {erro && <p className="mt-4 text-sm text-down">{erro}</p>}

        {feedback && (
          <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-left">
            <p className="text-xs text-gold">Simulação</p>
            <p className="mt-1 text-sm text-ink">{feedback}</p>
          </div>
        )}
      </div>
    </div>
  )
}
