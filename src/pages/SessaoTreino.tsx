import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronDown, Map, MoreHorizontal, Pencil, Plus, Share2 } from 'lucide-react'
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
  const [menuExercicio, setMenuExercicio] = useState(false)
  const [serieAtivaIndex, setSerieAtivaIndex] = useState(0)
  const [referencias, setReferencias] = useState<Record<number, { ultimoPeso: number; ultimoReps: number; sugerido: number }>>({})

  const [descansando, setDescansando] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(0)

  const [elapsedSeg, setElapsedSeg] = useState(0)
  const [treinoConcluido, setTreinoConcluido] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [novoPR, setNovoPR] = useState<{ pesoKg: number; reps: number; variacaoPercentual: number } | null>(null)
  const [totalPR, setTotalPR] = useState(0)
  const [serieSalvando, setSerieSalvando] = useState<string | null>(null)

  const sessaoConcluidaId = useRef<string | null>(null)
  const inicioMs = useRef<number>(Date.now())
  const volumeAcumulado = useRef(0)
  const sessaoIniciada = useRef(false)
  const seriesEmGravacao = useRef(new Set<string>())
  const finalizacaoEmCurso = useRef(false)

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
      setReferencias(
        Object.fromEntries(
          copiasIniciais.flatMap(({ ex, ultimo }) => {
            if (!ultimo) return []
            const item = rotina?.itens.find((it) => it.id === ex.itemId)
            const repsAlvo = item?.reps_max ?? ultimo.reps
            return [[ex.exercicioId, {
              ultimoPeso: ultimo.peso_kg,
              ultimoReps: ultimo.reps,
              sugerido: sugerirProximoPeso(ultimo.peso_kg, ultimo.reps, repsAlvo, ex.exercicio.grupo_muscular),
            }]]
          }),
        ),
      )
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
  const referenciaAtiva = ativo ? referencias[ativo.exercicioId] : undefined
  const proximaSerie = ativo?.sets[serieAtivaIndex]

  function selecionarExercicio(indice: number) {
    const exercicio = exercicios[indice]
    const primeiroPendente = exercicio?.sets.findIndex((set) => !set.completo) ?? -1
    setSerieAtivaIndex(primeiroPendente >= 0 ? primeiroPendente : Math.max((exercicio?.sets.length ?? 1) - 1, 0))
    setAtivoIndex(indice)
    setMenuExercicio(false)
    setEditandoDescanso(false)
  }

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
    const chaveSerie = `${ativoIndex}:${indiceSet}`
    if (seriesEmGravacao.current.has(chaveSerie) || ativo.sets[indiceSet]?.completo) return
    const linha = ativo.sets[indiceSet]
    const peso = Number(linha.peso.replace(',', '.'))
    const reps = Number(linha.reps)
    if (Number.isNaN(peso) || Number.isNaN(reps) || reps <= 0) {
      setErro('Preenche peso e reps antes de marcar a série.')
      return
    }
    setErro(null)
    seriesEmGravacao.current.add(chaveSerie)
    setSerieSalvando(chaveSerie)
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
        setTotalPR((total) => total + 1)
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
      const proxima = ativo.sets.findIndex((set, indice) => indice > indiceSet && !set.completo)
      if (proxima >= 0) setSerieAtivaIndex(proxima)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu pra registrar a série.')
    } finally {
      seriesEmGravacao.current.delete(chaveSerie)
      setSerieSalvando((atual) => atual === chaveSerie ? null : atual)
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
    if (finalizacaoEmCurso.current) return
    finalizacaoEmCurso.current = true
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
      finalizacaoEmCurso.current = false
      setFinalizando(false)
    }
  }

  if (treinoConcluido) {
    const seriesConcluidas = exercicios.reduce((total, exercicio) => total + exercicio.sets.filter((set) => set.completo).length, 0)
    return (
      <div className="animar-entrada mx-auto flex min-h-[70dvh] w-full max-w-xl flex-col justify-center py-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Treino concluído</p>
          <p className="num mt-5 text-[64px] font-semibold leading-none tracking-[-0.07em]">{formatoTempo(elapsedSeg)}</p>
          <p className="mt-2 text-xs text-ink-2">duração total</p>
          <div className="mt-8 grid grid-cols-3 divide-x divide-line/60 border-y border-line/60 py-5">
            <div><p className="num text-xl font-semibold">{seriesConcluidas}</p><p className="mt-1 text-[10px] uppercase tracking-[0.06em] text-ink-3">séries</p></div>
            <div><p className="num text-xl font-semibold">{formatoBR(volumeAcumulado.current)}</p><p className="mt-1 text-[10px] uppercase tracking-[0.06em] text-ink-3">kg volume</p></div>
            <div><p className={`num text-xl font-semibold ${totalPR > 0 ? 'text-gold' : ''}`}>{totalPR}</p><p className="mt-1 text-[10px] uppercase tracking-[0.06em] text-ink-3">novos PRs</p></div>
          </div>
          <button
            onClick={() => navigate('/treino', { replace: true })}
            className="mt-8 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Concluir
          </button>
          <div className="mt-3 flex justify-center gap-5">
            <button onClick={() => navigate('/corpo')} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-ink-2 hover:text-ink">
              <Map size={16} strokeWidth={1.75} /> Ver estímulos
            </button>
            {sessaoConcluidaId.current && (
              <button
                onClick={() => navigate(`/social?criar=1&sessao=${encodeURIComponent(sessaoConcluidaId.current!)}`)}
                className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand"
              >
                <Share2 size={16} strokeWidth={1.75} /> Compartilhar treino
              </button>
            )}
          </div>
      </div>
    )
  }

  if (mostrarSeletor) {
    return (
      <Page title="Adicionar exercício">
        <div className="mt-6">
          <SeletorExercicio onSelecionar={adicionarExercicio} selecionados={exercicios.map((exercicio) => exercicio.exercicioId)} />
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
    <div className="mx-auto max-w-2xl pb-6">
      <div className="sticky top-0 z-20 -mx-4 flex min-h-14 items-center justify-between border-b border-line/50 bg-app/90 px-4 backdrop-blur-lg lg:static lg:mx-0">
        <button onClick={() => navigate('/treino')} aria-label="Voltar" className="flex size-11 items-center justify-center text-ink-2">
          <ChevronDown size={21} strokeWidth={1.75} />
        </button>
        <div className="text-center">
          <p className="max-w-40 truncate text-xs font-semibold">{rotina?.nome ?? 'Treino rápido'}</p>
          <span className="num mt-0.5 block text-[10px] text-ink-3">{formatoTempo(elapsedSeg)}</span>
        </div>
        <button
          onClick={finalizarTreino}
          disabled={finalizando}
          className="min-h-11 px-2 text-xs font-semibold text-ink-2 transition-colors hover:text-ink disabled:opacity-60"
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

      <div className="mt-5 flex items-center justify-center gap-2 overflow-x-auto pb-1">
        {exercicios.map((ex, i) => (
          <button
            key={`${ex.exercicioId}-${i}`}
            onClick={() => selecionarExercicio(i)}
            className={`num flex size-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
              i === ativoIndex ? 'border-brand bg-brand text-white' : 'border-line text-ink-3'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setMostrarSeletor(true)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-line text-ink-3"
          aria-label="Adicionar exercício"
        >
          <Plus size={16} strokeWidth={1.75} />
        </button>
      </div>

      {!ativo ? (
        <div className="mt-6">
          <Empty text="Adiciona um exercício pra começar." />
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="num text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">Exercício {ativoIndex + 1} de {exercicios.length}</p>
              <h2 className="mt-2 text-[28px] font-semibold leading-[1.05] tracking-[-0.055em]">{ativo.exercicio.nome}</h2>
              <p className="mt-2 text-sm text-ink-2">{ativo.exercicio.grupo_muscular}</p>
            </div>
            <div className="relative">
              <button onClick={() => setMenuExercicio((aberto) => !aberto)} className="flex size-11 items-center justify-center text-ink-3 hover:text-ink" aria-label="Ações do exercício"><MoreHorizontal size={21} /></button>
              {menuExercicio && (
                <div className="absolute right-0 top-11 z-10 w-48 rounded-xl border border-line bg-card p-1.5">
                  <button onClick={() => navigate(`/treino/analisar/${ativo.exercicioId}`)} className="min-h-11 w-full rounded-lg px-3 text-left text-xs font-semibold text-ink-2 hover:bg-card-hover hover:text-ink">Analisar movimento</button>
                  <button onClick={() => { setEditandoDescanso(true); setMenuExercicio(false) }} className="min-h-11 w-full rounded-lg px-3 text-left text-xs font-semibold text-ink-2 hover:bg-card-hover hover:text-ink">Ajustar descanso</button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl bg-card">
            <img src={ativo.exercicio.gif} alt={ativo.exercicio.nome} className="mx-auto h-72 w-full object-contain mix-blend-lighten sm:h-80" />
          </div>

          {referenciaAtiva && (
            <div className="mt-5 grid grid-cols-2 divide-x divide-line/60 border-y border-line/60 py-4">
              <div className="pr-4"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">Última vez</p><p className="num mt-2 text-base font-semibold">{formatoBR(referenciaAtiva.ultimoPeso)} kg × {referenciaAtiva.ultimoReps}</p></div>
              <div className="pl-4"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">Sugestão</p><p className="num mt-2 text-base font-semibold text-brand">{formatoBR(referenciaAtiva.sugerido)} kg</p></div>
            </div>
          )}

          {novoPR && (
            <div className="mt-5 border-l-2 border-gold py-2 pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gold">Novo recorde</p>
              <p className="mt-1 text-sm font-semibold">{ativo.exercicio.nome}</p>
              <p className="num mt-1 text-lg font-semibold">{formatoBR(novoPR.pesoKg)} kg × {novoPR.reps} <span className="ml-2 text-xs text-gold">+{formatoBR(novoPR.variacaoPercentual)}%</span></p>
            </div>
          )}

          {editandoDescanso ? (
            <div className="mt-5 flex items-center gap-2 border-y border-line/60 py-3">
              <input
                type="number"
                inputMode="numeric"
                defaultValue={ativo.descansoSeg}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') salvarDescanso(Number((e.target as HTMLInputElement).value) || DESCANSO_PADRAO)
                }}
                onBlur={(e) => salvarDescanso(Number(e.target.value) || DESCANSO_PADRAO)}
                className="h-11 w-24 rounded-lg border border-line bg-card-hover px-2 text-sm text-ink focus:border-brand focus:outline-none"
              />
              <span className="text-sm text-ink-2">segundos de descanso</span>
            </div>
          ) : (
            <button
              onClick={() => setEditandoDescanso(true)}
              className="mt-4 flex min-h-11 items-center gap-1.5 text-xs text-ink-2 hover:text-ink"
            >
              <Pencil size={13} strokeWidth={1.75} />
              Descanso: {Math.floor(ativo.descansoSeg / 60)}min {ativo.descansoSeg % 60}s
            </button>
          )}

          {descansando && (
            <div className="mt-6 flex items-end justify-between border-y border-brand/30 py-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">Descanso</p>
                <p className="num mt-2 text-[56px] font-semibold leading-none tracking-[-0.07em]">{formatoTempo(segundosRestantes)}</p>
                {proximaSerie && (
                  <p className="num mt-3 text-xs text-ink-2">
                    Próxima série: {proximaSerie.peso || '—'} kg × {proximaSerie.reps || '—'}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDescansando(false)}
                className="min-h-11 px-4 text-xs font-semibold text-ink-2 hover:text-ink"
              >
                Pular
              </button>
            </div>
          )}

          {!descansando && <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-2">Séries</p>
            <div className="mt-3 divide-y divide-line/60 border-y border-line/60">
              {ativo.sets.map((linha, i) => i === serieAtivaIndex && !linha.completo ? (
                <div key={i} className="border-l-2 border-brand bg-brand/5 py-4 pl-4 pr-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand">Série {i + 1} · atual</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="text-[10px] uppercase tracking-[0.06em] text-ink-3">Carga
                      <div className="mt-1 flex h-14 items-center rounded-xl border border-line bg-card-hover px-3"><input type="text" inputMode="decimal" value={linha.peso} onChange={(e) => atualizarSet(i, 'peso', e.target.value)} className="num min-w-0 flex-1 bg-transparent text-center text-xl font-semibold outline-none" /><span className="text-xs text-ink-3">kg</span></div>
                    </label>
                    <label className="text-[10px] uppercase tracking-[0.06em] text-ink-3">Repetições
                      <div className="mt-1 flex h-14 items-center rounded-xl border border-line bg-card-hover px-3"><input type="number" inputMode="numeric" value={linha.reps} onChange={(e) => atualizarSet(i, 'reps', e.target.value)} className="num min-w-0 flex-1 bg-transparent text-center text-xl font-semibold outline-none" /><span className="text-xs text-ink-3">reps</span></div>
                    </label>
                  </div>
                  <button disabled={serieSalvando === `${ativoIndex}:${i}`} onClick={() => marcarCompleto(i)} className="mt-3 h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{serieSalvando === `${ativoIndex}:${i}` ? 'Salvando...' : 'Concluir série'}</button>
                </div>
              ) : (
                <button key={i} onClick={() => !linha.completo && setSerieAtivaIndex(i)} className={`grid min-h-14 w-full grid-cols-[4rem_1fr_auto] items-center gap-3 px-2 text-left ${linha.completo ? 'opacity-45' : 'hover:bg-card/60'}`}>
                  <span className="text-xs font-semibold text-ink-2">Série {i + 1}</span>
                  <span className="num text-sm">{linha.peso || '—'} kg · {linha.reps || '—'} reps</span>
                  <span className={linha.completo ? 'text-up' : 'text-ink-3'}>{linha.completo ? '✓' : '○'}</span>
                </button>
              ))}
            </div>
          </div>}

          {!descansando && <button
            onClick={adicionarSet}
            className="mt-3 min-h-11 w-full text-xs font-semibold text-ink-2 transition-colors hover:text-ink"
          >
            + Adicionar série
          </button>}

          <div className="mt-7 flex items-center justify-between border-t border-line/60 pt-4">
            <button onClick={() => selecionarExercicio(Math.max(0, ativoIndex - 1))} disabled={ativoIndex === 0} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-ink-2 disabled:opacity-30"><ArrowLeft size={16} /> Anterior</button>
            {ativoIndex < exercicios.length - 1 ? (
              <button onClick={() => selecionarExercicio(Math.min(exercicios.length - 1, ativoIndex + 1))} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-ink">Próximo <ArrowRight size={16} /></button>
            ) : (
              <button onClick={finalizarTreino} disabled={finalizando} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand disabled:opacity-50">Concluir treino <ArrowRight size={16} /></button>
            )}
          </div>
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
