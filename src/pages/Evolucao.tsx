import { useEffect, useState } from 'react'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { GraficoLinha } from '../components/GraficoLinha'
import { useSessao } from '../lib/auth'
import { useMedidas, adicionarMedida } from '../lib/medidas'
import {
  buscarDatasSessoesConcluidas,
  buscarExerciciosTreinados,
  buscarHistoricoExercicio,
  type RegistroDB,
} from '../lib/registros'
import { calcularConsistencia } from '../lib/consistencia'
import { EXERCICIOS } from '../data/exercicios'

function formatoBR(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function CardPeso({ userId }: { userId: string }) {
  const { medidas, carregando, erro, recarregar } = useMedidas(userId)
  const [pesoInput, setPesoInput] = useState('')
  const [enviando, setEnviando] = useState(false)

  const pesos = medidas.filter((m) => m.peso_kg !== null).map((m) => m.peso_kg as number)
  const pesoAtual = pesos.at(-1)

  async function registrarPeso() {
    const peso = Number(pesoInput.replace(',', '.'))
    if (Number.isNaN(peso) || peso <= 0) return
    setEnviando(true)
    try {
      await adicionarMedida(userId, { peso_kg: peso })
      setPesoInput('')
      recarregar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <h2 className="text-[17px] font-semibold">Peso</h2>

      {carregando ? (
        <p className="mt-3 text-sm text-ink-2">Carregando...</p>
      ) : erro ? (
        <p className="mt-3 text-sm text-ink-2">Não deu pra carregar seu histórico de peso.</p>
      ) : pesos.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">Nenhum registro de peso ainda.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink">
            Atual: <span className="num text-[17px] font-semibold">{formatoBR(pesoAtual!)} kg</span>
          </p>
          <div className="mt-4">
            <GraficoLinha valores={pesos} />
          </div>
        </>
      )}

      <div className="mt-4 flex gap-3">
        <input
          type="text"
          inputMode="decimal"
          value={pesoInput}
          onChange={(e) => setPesoInput(e.target.value)}
          placeholder="Peso hoje (kg)"
          className="h-11 flex-1 rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
        />
        <button
          onClick={registrarPeso}
          disabled={enviando}
          className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          Registrar
        </button>
      </div>
    </div>
  )
}

function CardConsistencia({ userId }: { userId: string }) {
  const [dados, setDados] = useState<{ ultimos7Dias: number; ultimos30Dias: number } | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    buscarDatasSessoesConcluidas(userId)
      .then((datas) => {
        if (cancelado) return
        setDados(calcularConsistencia(datas, new Date().toISOString()))
      })
      .catch((err) => {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra carregar.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId])

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <h2 className="text-[17px] font-semibold">Consistência</h2>
      {carregando ? (
        <p className="mt-3 text-sm text-ink-2">Carregando...</p>
      ) : erro || !dados ? (
        <p className="mt-3 text-sm text-ink-2">Não deu pra carregar sua consistência.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="num text-[28px] font-bold">{dados.ultimos7Dias}</p>
            <p className="text-xs text-ink-2">treinos nos últimos 7 dias</p>
          </div>
          <div>
            <p className="num text-[28px] font-bold">{dados.ultimos30Dias}</p>
            <p className="text-xs text-ink-2">treinos nos últimos 30 dias</p>
          </div>
        </div>
      )}
    </div>
  )
}

function CardCargas({ userId }: { userId: string }) {
  const [exercicioIds, setExercicioIds] = useState<number[] | null>(null)
  const [selecionado, setSelecionado] = useState<number | null>(null)
  const [historico, setHistorico] = useState<RegistroDB[] | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    buscarExerciciosTreinados(userId)
      .then((ids) => {
        if (cancelado) return
        setExercicioIds(ids)
        if (ids.length > 0) setSelecionado(ids[0])
        else setCarregando(false)
      })
      .catch((err) => {
        if (!cancelado) {
          setErro(err instanceof Error ? err.message : 'Não deu pra carregar.')
          setCarregando(false)
        }
      })
    return () => {
      cancelado = true
    }
  }, [userId])

  useEffect(() => {
    if (selecionado === null) return
    let cancelado = false
    setCarregando(true)
    buscarHistoricoExercicio(userId, selecionado)
      .then((dados) => {
        if (!cancelado) setHistorico(dados)
      })
      .catch((err) => {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra carregar.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId, selecionado])

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <h2 className="text-[17px] font-semibold">Cargas</h2>

      {exercicioIds !== null && exercicioIds.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">Registre séries nos treinos pra ver sua evolução de carga aqui.</p>
      ) : (
        <>
          {exercicioIds && exercicioIds.length > 0 && (
            <select
              value={selecionado ?? ''}
              onChange={(e) => setSelecionado(Number(e.target.value))}
              className="mt-3 h-11 w-full rounded-xl border border-line bg-card-hover px-3 text-sm text-ink focus:border-brand focus:outline-none"
            >
              {exercicioIds.map((id) => {
                const exercicio = EXERCICIOS.find((e) => e.id === id)
                return (
                  <option key={id} value={id}>
                    {exercicio?.nome ?? id}
                  </option>
                )
              })}
            </select>
          )}

          {carregando ? (
            <p className="mt-3 text-sm text-ink-2">Carregando...</p>
          ) : erro ? (
            <p className="mt-3 text-sm text-ink-2">Não deu pra carregar o histórico.</p>
          ) : historico && historico.length > 0 ? (
            <div className="mt-4">
              <GraficoLinha valores={historico.map((r) => r.peso_kg)} />
              <p className="mt-2 text-xs text-ink-2">
                Última: {formatoBR(historico.at(-1)!.peso_kg)} kg × {historico.at(-1)!.reps}
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

export default function Evolucao() {
  const { sessao } = useSessao()

  if (!sessao) {
    return (
      <Page title="Evolução">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  return (
    <Page title="Evolução">
      <div className="mt-6 space-y-5">
        <CardPeso userId={sessao.user.id} />
        <CardConsistencia userId={sessao.user.id} />
        <CardCargas userId={sessao.user.id} />
      </div>
    </Page>
  )
}
