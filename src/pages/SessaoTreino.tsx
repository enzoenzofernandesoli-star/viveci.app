import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { useSessao } from '../lib/auth'
import { usePerfil } from '../lib/perfil'
import { useProximoTreino, type ProximoTreino } from '../lib/plano'
import { buscarUltimoRegistro, registrarSerie, iniciarSessao, concluirSessao, type RegistroDB } from '../lib/registros'
import { sugerirProximoPeso } from '../lib/progressaoCarga'

function formatoBR(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function ExecutorTreino({ userId, dados }: { userId: string; dados: ProximoTreino }) {
  const navigate = useNavigate()
  const { sessao: sessaoTreino, itens } = dados

  const [indiceExercicio, setIndiceExercicio] = useState(0)
  const [serieAtual, setSerieAtual] = useState(1)
  const [pesoInput, setPesoInput] = useState('')
  const [repsInput, setRepsInput] = useState('')
  const [ultimoRegistro, setUltimoRegistro] = useState<RegistroDB | null>(null)
  const [carregandoUltimo, setCarregandoUltimo] = useState(true)

  const [descansando, setDescansando] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(0)

  const [treinoConcluido, setTreinoConcluido] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const sessaoConcluidaId = useRef<string | null>(null)
  const inicioMs = useRef<number>(Date.now())
  const volumeAcumulado = useRef(0)
  const proximaAcao = useRef<(() => void) | null>(null)

  const itemAtual = itens[indiceExercicio]

  useEffect(() => {
    iniciarSessao(userId, sessaoTreino.id)
      .then((id) => {
        sessaoConcluidaId.current = id
      })
      .catch((err) => setErro(err instanceof Error ? err.message : 'Não deu pra iniciar a sessão.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelado = false
    setCarregandoUltimo(true)
    buscarUltimoRegistro(userId, itemAtual.exercicio_id)
      .then((registro) => {
        if (cancelado) return
        setUltimoRegistro(registro)
        if (registro) {
          const pesoSugerido = sugerirProximoPeso(
            registro.peso_kg,
            registro.reps,
            itemAtual.reps_max,
            itemAtual.exercicio.grupo_muscular,
          )
          setPesoInput(String(pesoSugerido).replace('.', ','))
          setRepsInput(String(itemAtual.reps_max))
        } else {
          setPesoInput('')
          setRepsInput(String(itemAtual.reps_min))
        }
      })
      .finally(() => {
        if (!cancelado) setCarregandoUltimo(false)
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceExercicio])

  useEffect(() => {
    if (!descansando) return
    if (segundosRestantes <= 0) {
      setDescansando(false)
      proximaAcao.current?.()
      return
    }
    const id = setTimeout(() => setSegundosRestantes((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [descansando, segundosRestantes])

  async function finalizarTreino() {
    setFinalizando(true)
    setErro(null)
    try {
      const duracaoSeg = Math.round((Date.now() - inicioMs.current) / 1000)
      if (sessaoConcluidaId.current) {
        await concluirSessao(sessaoConcluidaId.current, volumeAcumulado.current, duracaoSeg)
      }
      setTreinoConcluido(true)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra concluir o treino.')
    } finally {
      setFinalizando(false)
    }
  }

  function iniciarDescanso(acao: () => void) {
    proximaAcao.current = acao
    setSegundosRestantes(itemAtual.descanso_seg)
    setDescansando(true)
  }

  async function registrarEAvancar() {
    const peso = Number(pesoInput.replace(',', '.'))
    const reps = Number(repsInput)
    if (Number.isNaN(peso) || Number.isNaN(reps) || reps <= 0) return

    setErro(null)
    try {
      await registrarSerie({
        userId,
        exercicioId: itemAtual.exercicio_id,
        sessaoId: sessaoTreino.id,
        serieNum: serieAtual,
        pesoKg: peso,
        reps,
      })
      volumeAcumulado.current += peso * reps

      const ultimaSerieDoExercicio = serieAtual >= itemAtual.series
      const ultimoExercicio = indiceExercicio >= itens.length - 1

      if (ultimaSerieDoExercicio && ultimoExercicio) {
        await finalizarTreino()
        return
      }

      if (ultimaSerieDoExercicio) {
        iniciarDescanso(() => {
          setIndiceExercicio((i) => i + 1)
          setSerieAtual(1)
        })
      } else {
        iniciarDescanso(() => setSerieAtual((s) => s + 1))
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra registrar a série.')
    }
  }

  if (treinoConcluido) {
    return (
      <Page title="Treino concluído">
        <div className="mt-6 rounded-2xl border border-line bg-card p-6 text-center">
          <p className="text-[17px] font-semibold text-ink">Treino concluído.</p>
          <p className="mt-2 text-sm text-ink-2">
            Volume total: <span className="num text-ink">{formatoBR(volumeAcumulado.current)} kg</span>
          </p>
          <button
            onClick={() => navigate('/treinos', { replace: true })}
            className="mt-6 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Voltar
          </button>
        </div>
      </Page>
    )
  }

  if (descansando) {
    return (
      <Page title="Descanso">
        <div className="mt-6 rounded-2xl border border-line bg-card p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Descanso</p>
          <p className="num mt-3 text-[56px] font-bold leading-none text-brand">{segundosRestantes}s</p>
          <button
            onClick={() => {
              setDescansando(false)
              proximaAcao.current?.()
            }}
            className="mt-6 h-12 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
          >
            Pular descanso
          </button>
        </div>
      </Page>
    )
  }

  return (
    <Page title={itemAtual.exercicio.nome}>
      <div className="mt-6 rounded-2xl border border-line bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
          Exercício {indiceExercicio + 1} de {itens.length} · Série {serieAtual} de {itemAtual.series}
        </p>
        <h2 className="mt-1 text-[17px] font-semibold">{itemAtual.exercicio.nome}</h2>
        <p className="mt-1 text-sm text-ink-2">
          Alvo: {itemAtual.reps_min}-{itemAtual.reps_max} reps · Descanso {itemAtual.descanso_seg}s
        </p>

        <p className="mt-4 text-sm text-ink-2">
          {carregandoUltimo
            ? 'Carregando último registro...'
            : ultimoRegistro
              ? `Última vez: ${formatoBR(ultimoRegistro.peso_kg)} kg × ${ultimoRegistro.reps}`
              : 'Primeira vez nesse exercício.'}
        </p>

        <div className="mt-5 flex gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
              Peso (kg)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={pesoInput}
              onChange={(e) => setPesoInput(e.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">
              Reps
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={repsInput}
              onChange={(e) => setRepsInput(e.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        {erro && <p className="mt-4 text-sm text-down">{erro}</p>}

        <button
          onClick={registrarEAvancar}
          disabled={finalizando}
          className="mt-6 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {finalizando ? 'Salvando...' : 'Registrar série'}
        </button>
      </div>
    </Page>
  )
}

export default function SessaoTreino() {
  const { sessao } = useSessao()
  const { perfil, carregando: carregandoPerfil } = usePerfil(sessao?.user.id)
  const { dados, carregando, erro } = useProximoTreino(sessao?.user.id, perfil)

  if (carregandoPerfil || carregando) {
    return (
      <Page title="Treino">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  if (erro || !dados || !sessao) {
    return (
      <Page title="Treino">
        <Empty text="Não deu pra carregar seu treino. Tenta de novo em instantes." />
      </Page>
    )
  }

  return <ExecutorTreino userId={sessao.user.id} dados={dados} />
}
