import { Fragment, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronDown, Pencil, Plus } from 'lucide-react'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { SeletorExercicio } from '../components/SeletorExercicio'
import { useSessao } from '../lib/auth'
import { useRotina, atualizarDescansoItem, type Rotina } from '../lib/rotinas'
import {
  buscarUltimoRegistro,
  buscarHistoricoExercicio,
  registrarSerie,
  iniciarSessao,
  concluirSessao,
} from '../lib/registros'
import { sugerirProximoPeso } from '../lib/progressaoCarga'
import { detectarPR } from '../lib/recordesPessoais'
import { reconstruirTreinoExpress, type ItemParaExpress } from '../lib/treinoExpress'
import { EXERCICIOS, type Exercicio } from '../data/exercicios'

const DESCANSO_PADRAO = 90

type LinhaSet = { peso: string; reps: string; completo: boolean }

type ExercicioSessao = {
  itemId: string | null
  exercicioId: number
  exercicio: Exercicio
  descansoSeg: number
  sets: LinhaSet[]
}

function formatoTempo(totalSeg: number): string {
  const m = Math.floor(totalSeg / 60)
  const s = totalSeg % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatoBR(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function ExecutorTreino({
  userId,
  rotina,
  minutosExpress,
}: {
  userId: string
  rotina: Rotina | null
  minutosExpress: number | null
}) {
  const navigate = useNavigate()

  const resumoExpress =
    rotina && minutosExpress
      ? reconstruirTreinoExpress(
          rotina.itens.map(
            (item, i): ItemParaExpress => ({
              id: item.id,
              exercicioId: item.exercicio_id,
              nome: item.exercicio.nome,
              isComposto: item.exercicio.is_composto,
              series: item.series,
              descansoSeg: item.descanso_seg,
              ordem: item.ordem ?? i,
            }),
          ),
          minutosExpress,
        )
      : null

  const [exercicios, setExercicios] = useState<ExercicioSessao[]>(() => {
    if (!rotina) return []
    const itensFinais = resumoExpress
      ? resumoExpress.itens.map((e) => ({ item: rotina.itens.find((it) => it.id === e.id)!, seriesFinal: e.seriesFinal }))
      : rotina.itens.map((item) => ({ item, seriesFinal: item.series }))

    return itensFinais.map(({ item, seriesFinal }) => ({
      itemId: item.id,
      exercicioId: item.exercicio_id,
      exercicio: item.exercicio,
      descansoSeg: item.descanso_seg,
      sets: Array.from({ length: Math.max(seriesFinal, 1) }, () => ({ peso: '', reps: '', completo: false })),
    }))
  })
  const [mostrarResumoExpress, setMostrarResumoExpress] = useState(resumoExpress !== null)
  const [ativoIndex, setAtivoIndex] = useState(0)
  const [mostrarSeletor, setMostrarSeletor] = useState(false)
  const [editandoDescanso, setEditandoDescanso] = useState(false)

  const [descansando, setDescansando] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(0)

  const [elapsedSeg, setElapsedSeg] = useState(0)
  const [treinoConcluido, setTreinoConcluido] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [novoPR, setNovoPR] = useState<{ pesoKg: number; reps: number; variacaoPercentual: number } | null>(null)

  const sessaoConcluidaId = useRef<string | null>(null)
  const inicioMs = useRef<number>(Date.now())
  const volumeAcumulado = useRef(0)
  const sessaoIniciada = useRef(false)

  useEffect(() => {
    if (sessaoIniciada.current) return
    sessaoIniciada.current = true
    iniciarSessao(userId, rotina?.sessaoId ?? null)
      .then((id) => {
        sessaoConcluidaId.current = id
      })
      .catch((err) => setErro(err instanceof Error ? err.message : 'Não deu pra iniciar a sessão.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const id = setInterval(() => setElapsedSeg(Math.floor((Date.now() - inicioMs.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!novoPR) return
    const id = setTimeout(() => setNovoPR(null), 5000)
    return () => clearTimeout(id)
  }, [novoPR])

  useEffect(() => {
    if (!descansando) return
    if (segundosRestantes <= 0) {
      setDescansando(false)
      return
    }
    const id = setTimeout(() => setSegundosRestantes((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [descansando, segundosRestantes])

  // pré-preenche a primeira série de cada exercício inicial com o último registro
  useEffect(() => {
    let cancelado = false
    async function prefil() {
      const copiasIniciais = await Promise.all(
        exercicios.map(async (ex) => {
          const ultimo = await buscarUltimoRegistro(userId, ex.exercicioId)
          return { ex, ultimo }
        }),
      )
      if (cancelado) return
      setExercicios((atual) =>
        atual.map((ex, i) => {
          const { ultimo } = copiasIniciais[i]
          if (!ultimo || ex.sets[0]?.peso !== '') return ex
          const item = rotina?.itens.find((it) => it.id === ex.itemId)
          const repsAlvo = item?.reps_max ?? ultimo.reps
          const pesoSugerido = sugerirProximoPeso(ultimo.peso_kg, ultimo.reps, repsAlvo, ex.exercicio.grupo_muscular)
          const sets = [...ex.sets]
          sets[0] = { ...sets[0], peso: String(pesoSugerido).replace('.', ','), reps: String(ultimo.reps) }
          return { ...ex, sets }
        }),
      )
    }
    prefil()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ativo = exercicios[ativoIndex] as ExercicioSessao | undefined

  async function adicionarExercicio(exercicioId: number) {
    const exercicio = EXERCICIOS.find((e) => e.id === exercicioId)!
    const ultimo = await buscarUltimoRegistro(userId, exercicioId)
    const primeiraLinha: LinhaSet = ultimo
      ? { peso: String(ultimo.peso_kg).replace('.', ','), reps: String(ultimo.reps), completo: false }
      : { peso: '', reps: '', completo: false }
    setExercicios((atual) => [
      ...atual,
      { itemId: null, exercicioId, exercicio, descansoSeg: DESCANSO_PADRAO, sets: [primeiraLinha] },
    ])
    setAtivoIndex(exercicios.length)
    setMostrarSeletor(false)
  }

  function atualizarSet(indiceSet: number, campo: 'peso' | 'reps', valor: string) {
    setExercicios((atual) =>
      atual.map((ex, i) => {
        if (i !== ativoIndex) return ex
        const sets = ex.sets.map((s, j) => (j === indiceSet ? { ...s, [campo]: valor } : s))
        return { ...ex, sets }
      }),
    )
  }

  function adicionarSet() {
    setExercicios((atual) =>
      atual.map((ex, i) => {
        if (i !== ativoIndex) return ex
        const ultima = ex.sets.at(-1)
        return { ...ex, sets: [...ex.sets, { peso: ultima?.peso ?? '', reps: ultima?.reps ?? '', completo: false }] }
      }),
    )
  }

  async function marcarCompleto(indiceSet: number) {
    if (!ativo) return
    const linha = ativo.sets[indiceSet]
    const peso = Number(linha.peso.replace(',', '.'))
    const reps = Number(linha.reps)
    if (Number.isNaN(peso) || Number.isNaN(reps) || reps <= 0) {
      setErro('Preenche peso e reps antes de marcar a série.')
      return
    }
    setErro(null)
    try {
      const historico = await buscarHistoricoExercicio(userId, ativo.exercicioId)
      const dataAgora = new Date().toISOString()
      const resultadoPR = detectarPR(historico, { peso_kg: peso, reps, data: dataAgora })

      await registrarSerie({
        userId,
        exercicioId: ativo.exercicioId,
        sessaoId: rotina?.sessaoId ?? null,
        serieNum: indiceSet + 1,
        pesoKg: peso,
        reps,
      })
      volumeAcumulado.current += peso * reps

      if (resultadoPR.isPR && historico.length > 0 && resultadoPR.variacaoPercentual !== null) {
        setNovoPR({ pesoKg: peso, reps, variacaoPercentual: resultadoPR.variacaoPercentual })
      }
      setExercicios((atual) =>
        atual.map((ex, i) => {
          if (i !== ativoIndex) return ex
          const sets = ex.sets.map((s, j) => (j === indiceSet ? { ...s, completo: true } : s))
          return { ...ex, sets }
        }),
      )
      setSegundosRestantes(ativo.descansoSeg)
      setDescansando(true)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra registrar a série.')
    }
  }

  async function salvarDescanso(novoSeg: number) {
    if (!ativo) return
    setExercicios((atual) => atual.map((ex, i) => (i === ativoIndex ? { ...ex, descansoSeg: novoSeg } : ex)))
    setEditandoDescanso(false)
    if (ativo.itemId) {
      try {
        await atualizarDescansoItem(ativo.itemId, novoSeg)
      } catch {
        /* não bloqueia o treino se o ajuste não salvar */
      }
    }
  }

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

  if (treinoConcluido) {
    return (
      <Page title="Treino concluído">
        <div className="mt-6 rounded-2xl border border-line bg-card p-6 text-center">
          <p className="text-[17px] font-semibold text-ink">Treino concluído.</p>
          <p className="mt-2 text-sm text-ink-2">
            Duração: <span className="num text-ink">{formatoTempo(elapsedSeg)}</span> · Volume:{' '}
            <span className="num text-ink">{formatoBR(volumeAcumulado.current)} kg</span>
          </p>
          <button
            onClick={() => navigate('/treino', { replace: true })}
            className="mt-6 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Voltar
          </button>
        </div>
      </Page>
    )
  }

  if (mostrarSeletor) {
    return (
      <Page title="Adicionar exercício">
        <div className="mt-6">
          <SeletorExercicio onSelecionar={adicionarExercicio} />
          <button
            onClick={() => setMostrarSeletor(false)}
            className="mt-4 h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
          >
            Cancelar
          </button>
        </div>
      </Page>
    )
  }

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/treino')} aria-label="Voltar" className="text-ink-2">
          <ChevronDown size={22} strokeWidth={1.75} />
        </button>
        <span className="num text-lg font-bold text-ink">{formatoTempo(elapsedSeg)}</span>
        <button
          onClick={finalizarTreino}
          disabled={finalizando}
          className="h-9 rounded-xl border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-card-hover disabled:opacity-60"
        >
          {finalizando ? '...' : 'Concluir'}
        </button>
      </div>

      {mostrarResumoExpress && resumoExpress && (
        <div className="mt-4 rounded-xl border border-line bg-card-hover px-4 py-3">
          <p className="text-sm text-ink">
            Reduzimos <span className="num font-semibold">{resumoExpress.minutosReduzidos} min</span> priorizando os
            exercícios mais importantes pra sua sessão.
          </p>
          <button onClick={() => setMostrarResumoExpress(false)} className="mt-2 text-xs font-semibold text-ink-2 hover:text-ink">
            Entendi
          </button>
        </div>
      )}

      <div className="-mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-1">
        {exercicios.map((ex, i) => (
          <button
            key={`${ex.exercicioId}-${i}`}
            onClick={() => setAtivoIndex(i)}
            className={`h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 ${
              i === ativoIndex ? 'border-brand' : 'border-line'
            }`}
          >
            <img src={ex.exercicio.gif} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
        <button
          onClick={() => setMostrarSeletor(true)}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-line text-ink-3"
          aria-label="Adicionar exercício"
        >
          <Plus size={20} strokeWidth={1.75} />
        </button>
      </div>

      {!ativo ? (
        <div className="mt-6">
          <Empty text="Adiciona um exercício pra começar." />
        </div>
      ) : (
        <div className="mt-6">
          <img src={ativo.exercicio.gif} alt={ativo.exercicio.nome} className="mx-auto h-56 w-56 object-contain" />

          <h2 className="text-[19px] font-bold">{ativo.exercicio.nome}</h2>
          <p className="text-sm text-ink-2">{ativo.exercicio.grupo_muscular}</p>

          {novoPR && (
            <div className="mt-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
              <p className="text-sm font-semibold text-gold">Novo PR!</p>
              <p className="mt-0.5 text-sm text-ink">
                <span className="num font-semibold">{formatoBR(novoPR.pesoKg)}kg</span> × {novoPR.reps} —{' '}
                <span className="num">+{formatoBR(novoPR.variacaoPercentual)}%</span>
              </p>
            </div>
          )}

          {editandoDescanso ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                defaultValue={ativo.descansoSeg}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') salvarDescanso(Number((e.target as HTMLInputElement).value) || DESCANSO_PADRAO)
                }}
                onBlur={(e) => salvarDescanso(Number(e.target.value) || DESCANSO_PADRAO)}
                className="h-9 w-24 rounded-lg border border-line bg-card-hover px-2 text-sm text-ink focus:border-brand focus:outline-none"
              />
              <span className="text-sm text-ink-2">segundos de descanso</span>
            </div>
          ) : (
            <button
              onClick={() => setEditandoDescanso(true)}
              className="mt-3 flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink"
            >
              <Pencil size={13} strokeWidth={1.75} />
              Descanso: {Math.floor(ativo.descansoSeg / 60)}min {ativo.descansoSeg % 60}s
            </button>
          )}

          {descansando && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-brand/30 bg-brand/10 px-4 py-3">
              <p className="text-sm text-ink">
                Descansando... <span className="num font-semibold text-brand">{segundosRestantes}s</span>
              </p>
              <button
                onClick={() => setDescansando(false)}
                className="h-8 rounded-lg border border-line px-3 text-xs font-semibold text-ink-2"
              >
                Pular
              </button>
            </div>
          )}

          <div className="mt-5 grid grid-cols-[auto_1fr_1fr_auto] items-center gap-x-3 gap-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Set</span>
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Kg</span>
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-2">Reps</span>
            <span />

            {ativo.sets.map((linha, i) => (
              <Fragment key={i}>
                <span className="num text-sm text-ink-2">{i + 1}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={linha.peso}
                  disabled={linha.completo}
                  onChange={(e) => atualizarSet(i, 'peso', e.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-card-hover px-2 text-center text-sm text-ink focus:border-brand focus:outline-none disabled:opacity-50"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={linha.reps}
                  disabled={linha.completo}
                  onChange={(e) => atualizarSet(i, 'reps', e.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-card-hover px-2 text-center text-sm text-ink focus:border-brand focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => marcarCompleto(i)}
                  disabled={linha.completo}
                  aria-label="Marcar série completa"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    linha.completo ? 'border-up bg-up/15 text-up' : 'border-line text-ink-3'
                  }`}
                >
                  ✓
                </button>
              </Fragment>
            ))}
          </div>

          <button
            onClick={adicionarSet}
            className="mt-4 h-11 w-full rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors hover:bg-card-hover"
          >
            + Adicionar série
          </button>
        </div>
      )}

      {erro && <p className="mt-4 text-sm text-down">{erro}</p>}
    </div>
  )
}

export default function SessaoTreino() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { sessao } = useSessao()
  const { rotina, carregando, erro } = useRotina(id)

  const minutosParam = Number(searchParams.get('minutos'))
  const minutosExpress = minutosParam > 0 ? minutosParam : null

  if (!sessao || (id && carregando)) {
    return (
      <Page title="Treino">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  if (id && (erro || !rotina)) {
    return (
      <Page title="Treino">
        <Empty text="Não deu pra carregar essa rotina. Tenta de novo em instantes." />
      </Page>
    )
  }

  return <ExecutorTreino userId={sessao.user.id} rotina={id ? rotina! : null} minutosExpress={minutosExpress} />
}
