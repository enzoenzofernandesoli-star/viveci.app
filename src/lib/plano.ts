import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'
import { gerarPlanoTreino, type EntradaTreino } from './treino.ts'
import { EXERCICIOS } from '../data/exercicios.ts'
import type { PerfilDB } from './perfil.ts'
import { calcularProximaSessao } from './progressaoTreino.ts'

export type PlanoDB = {
  id: string
  user_id: string
  nome: string
  semanas: number
  data_inicio: string
  ativo: boolean
}

export type PlanoSessaoDB = {
  id: string
  plano_id: string
  semana: number
  dia_semana: number
  nome_sessao: string
  tipo: string
  ordem: number
}

export type PlanoItemDB = {
  id: string
  sessao_id: string
  exercicio_id: number
  series: number
  reps_min: number
  reps_max: number
  descanso_seg: number
  ordem: number
  tecnica: string
}

const TOTAL_SEMANAS = 12

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabelas `planos`, `plano_sessoes`, `plano_itens`
// ─────────────────────────────────────────────────────────────

export async function buscarPlanoAtivo(userId: string): Promise<PlanoDB | null> {
  const { data, error } = await supabase
    .from('planos')
    .select('*')
    .eq('user_id', userId)
    .eq('ativo', true)
    .order('data_inicio', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Gera o plano de 12 semanas a partir do perfil e grava tudo no banco. */
export async function criarPlano(userId: string, perfil: PerfilDB): Promise<PlanoDB> {
  const entrada: EntradaTreino = {
    nivel: perfil.nivel!,
    objetivo: perfil.objetivo!,
    biotipo: perfil.biotipo!,
    local_treino: perfil.local_treino!,
    dias_semana: perfil.dias_semana!,
    tempo_sessao_min: perfil.tempo_sessao_min!,
  }
  const gerado = gerarPlanoTreino(entrada, EXERCICIOS)

  const { data: plano, error: erroPlano } = await supabase
    .from('planos')
    .insert({ user_id: userId, nome: 'Plano de 12 semanas', semanas: TOTAL_SEMANAS })
    .select()
    .single()
  if (erroPlano) throw erroPlano

  const sessoesAchatadas = gerado.semanas.flatMap((semana) =>
    semana.sessoes.map((sessao) => ({ semana, sessao })),
  )

  const { data: sessoesDB, error: erroSessoes } = await supabase
    .from('plano_sessoes')
    .insert(
      sessoesAchatadas.map(({ semana, sessao }) => ({
        plano_id: plano.id,
        semana: semana.semana,
        dia_semana: sessao.ordem,
        nome_sessao: sessao.nome_sessao,
        ordem: sessao.ordem,
      })),
    )
    .select()
  if (erroSessoes) throw erroSessoes

  const itens = sessoesAchatadas.flatMap(({ sessao }, i) =>
    sessao.itens.map((item, j) => ({
      sessao_id: sessoesDB[i].id,
      exercicio_id: item.exercicio_id,
      series: item.series,
      reps_min: item.reps_min,
      reps_max: item.reps_max,
      descanso_seg: item.descanso_seg,
      ordem: j + 1,
      tecnica: item.tecnica,
    })),
  )

  const { error: erroItens } = await supabase.from('plano_itens').insert(itens)
  if (erroItens) throw erroItens

  return plano
}

async function contarSessoesConcluidas(userId: string, planoSessaoIds: string[]): Promise<number> {
  if (planoSessaoIds.length === 0) return 0
  const { count, error } = await supabase
    .from('sessoes_concluidas')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('finalizada_em', 'is', null)
    .in('sessao_id', planoSessaoIds)
  if (error) throw error
  return count ?? 0
}

export type ProximoTreino = {
  plano: PlanoDB
  sessao: PlanoSessaoDB
  itens: (PlanoItemDB & { exercicio: (typeof EXERCICIOS)[number] })[]
}

/** Plano ativo do usuário + qual é a próxima sessão a fazer. Cria o plano se ainda não existir. */
export function useProximoTreino(userId: string | undefined, perfil: PerfilDB | null) {
  const [dados, setDados] = useState<ProximoTreino | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || !perfil) {
      setCarregando(false)
      return
    }
    let cancelado = false

    async function carregar() {
      try {
        setCarregando(true)
        setErro(null)

        let plano = await buscarPlanoAtivo(userId!)
        if (!plano) plano = await criarPlano(userId!, perfil!)

        const { data: todasSessoes, error: erroTodas } = await supabase
          .from('plano_sessoes')
          .select('*')
          .eq('plano_id', plano.id)
          .order('semana', { ascending: true })
          .order('ordem', { ascending: true })
        if (erroTodas) throw erroTodas

        const sessoesPorSemana = todasSessoes.filter((s) => s.semana === 1).length
        const idsTodos = todasSessoes.map((s) => s.id)
        const concluidas = await contarSessoesConcluidas(userId!, idsTodos)
        const proxima = calcularProximaSessao(sessoesPorSemana, concluidas)

        const sessao = todasSessoes.find(
          (s) => s.semana === proxima.semana && s.ordem === proxima.ordemNaSemana,
        )!

        const { data: itensDB, error: erroItens } = await supabase
          .from('plano_itens')
          .select('*')
          .eq('sessao_id', sessao.id)
          .order('ordem', { ascending: true })
        if (erroItens) throw erroItens

        const itens = itensDB.map((item) => ({
          ...item,
          exercicio: EXERCICIOS.find((e) => e.id === item.exercicio_id)!,
        }))

        if (!cancelado) setDados({ plano, sessao, itens })
      } catch (err) {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra carregar o treino.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [userId, perfil])

  return { dados, carregando, erro }
}
