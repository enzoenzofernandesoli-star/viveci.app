import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'
import { EXERCICIOS, type Exercicio } from '../data/exercicios.ts'

export type RotinaDB = {
  id: string
  user_id: string
  nome: string
  data_inicio: string
  ativo: boolean
}

export type ItemRotinaDB = {
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

export type ItemRotina = ItemRotinaDB & { exercicio: Exercicio }

export type Rotina = {
  id: string
  nome: string
  sessaoId: string
  itens: ItemRotina[]
}

function comExercicio(item: ItemRotinaDB): ItemRotina {
  return { ...item, exercicio: EXERCICIOS.find((e) => e.id === item.exercicio_id)! }
}

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabelas `planos`, `plano_sessoes`, `plano_itens`
// Cada rotina do usuário é uma linha em `planos` com uma única `plano_sessoes`
// associada (sem semanas, sem progressão automática).
// ─────────────────────────────────────────────────────────────

/** Lista de rotinas do usuário, com os exercícios de cada uma. */
export function useRotinas(userId: string | undefined) {
  const [rotinas, setRotinas] = useState<Rotina[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!userId) {
      setCarregando(false)
      return
    }
    let cancelado = false

    async function carregar() {
      try {
        setCarregando(true)
        setErro(null)

        const { data: rotinasDB, error: erroRotinas } = await supabase
          .from('planos')
          .select('*')
          .eq('user_id', userId)
          .order('data_inicio', { ascending: true })
        if (erroRotinas) throw erroRotinas

        if (rotinasDB.length === 0) {
          if (!cancelado) setRotinas([])
          return
        }

        const { data: sessoesDB, error: erroSessoes } = await supabase
          .from('plano_sessoes')
          .select('*')
          .in(
            'plano_id',
            rotinasDB.map((r) => r.id),
          )
        if (erroSessoes) throw erroSessoes

        const { data: itensDB, error: erroItens } = await supabase
          .from('plano_itens')
          .select('*')
          .in(
            'sessao_id',
            sessoesDB.map((s) => s.id),
          )
          .order('ordem', { ascending: true })
        if (erroItens) throw erroItens

        const montadas = rotinasDB.map((r) => {
          const sessao = sessoesDB.find((s) => s.plano_id === r.id)!
          const itens = itensDB.filter((i) => i.sessao_id === sessao.id).map(comExercicio)
          return { id: r.id, nome: r.nome, sessaoId: sessao.id, itens }
        })

        if (!cancelado) setRotinas(montadas)
      } catch (err) {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra carregar suas rotinas.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [userId, versao])

  return { rotinas, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

/** Uma rotina específica, com os exercícios já com a série/reps/descanso configurados. */
export function useRotina(rotinaId: string | undefined) {
  const [rotina, setRotina] = useState<Rotina | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!rotinaId) {
      setCarregando(false)
      return
    }
    let cancelado = false

    async function carregar() {
      try {
        setCarregando(true)
        setErro(null)

        const { data: rotinaDB, error: erroRotina } = await supabase
          .from('planos')
          .select('*')
          .eq('id', rotinaId)
          .single()
        if (erroRotina) throw erroRotina

        const { data: sessaoDB, error: erroSessao } = await supabase
          .from('plano_sessoes')
          .select('*')
          .eq('plano_id', rotinaId)
          .single()
        if (erroSessao) throw erroSessao

        const { data: itensDB, error: erroItens } = await supabase
          .from('plano_itens')
          .select('*')
          .eq('sessao_id', sessaoDB.id)
          .order('ordem', { ascending: true })
        if (erroItens) throw erroItens

        if (!cancelado) {
          setRotina({
            id: rotinaDB.id,
            nome: rotinaDB.nome,
            sessaoId: sessaoDB.id,
            itens: itensDB.map(comExercicio),
          })
        }
      } catch (err) {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra carregar a rotina.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [rotinaId, versao])

  return { rotina, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

/** Cria uma rotina vazia (e a única sessão que a acompanha) e devolve os ids. */
export async function criarRotina(userId: string, nome: string): Promise<{ rotinaId: string; sessaoId: string }> {
  if (!userId) throw new Error('Usuário inválido.')
  const { data, error } = await supabase.rpc('criar_rotina', { p_nome: nome })
  if (error) throw error
  const criada = data?.[0]
  if (!criada) throw new Error('Não deu pra criar a rotina.')
  return { rotinaId: criada.rotina_id, sessaoId: criada.sessao_id }
}

export async function renomearRotina(rotinaId: string, nome: string) {
  const { error } = await supabase.from('planos').update({ nome }).eq('id', rotinaId)
  if (error) throw error
}

export async function excluirRotina(rotinaId: string) {
  const { error } = await supabase.from('planos').delete().eq('id', rotinaId)
  if (error) throw error
}

/** Substitui a lista inteira de exercícios de uma rotina pela nova ordem/seleção. */
export async function salvarItensRotina(sessaoId: string, exercicioIds: number[]) {
  const itens = exercicioIds.map((exercicioId, i) => ({ exercicio_id: exercicioId, ordem: i + 1 }))
  const { error } = await supabase.rpc('salvar_itens_rotina', { p_sessao_id: sessaoId, p_itens: itens })
  if (error) throw error
}

/** Ajusta o tempo de descanso de um exercício específico da rotina. */
export async function atualizarDescansoItem(itemId: string, descansoSeg: number) {
  const { error } = await supabase.from('plano_itens').update({ descanso_seg: descansoSeg }).eq('id', itemId)
  if (error) throw error
}
