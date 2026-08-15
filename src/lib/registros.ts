import { supabase } from './supabase.ts'

export type RegistroDB = {
  id: string
  user_id: string
  exercicio_id: number
  sessao_id: string | null
  serie_num: number
  peso_kg: number
  reps: number
  data: string
}

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabelas `registros` e `sessoes_concluidas`
// ─────────────────────────────────────────────────────────────

/** Último registro do usuário nesse exercício, pra pré-preencher peso e reps. */
export async function buscarUltimoRegistro(userId: string, exercicioId: number): Promise<RegistroDB | null> {
  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .eq('user_id', userId)
    .eq('exercicio_id', exercicioId)
    .order('data', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function registrarSerie(dados: {
  userId: string
  exercicioId: number
  sessaoId: string | null
  serieNum: number
  pesoKg: number
  reps: number
}) {
  const { error } = await supabase.from('registros').insert({
    user_id: dados.userId,
    exercicio_id: dados.exercicioId,
    sessao_id: dados.sessaoId,
    serie_num: dados.serieNum,
    peso_kg: dados.pesoKg,
    reps: dados.reps,
  })
  if (error) throw error
}

/** sessaoId nulo = treino rápido, sem rotina salva por trás. */
export async function iniciarSessao(userId: string, sessaoId: string | null): Promise<string> {
  const { data, error } = await supabase
    .from('sessoes_concluidas')
    .insert({ user_id: userId, sessao_id: sessaoId, iniciada_em: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data.id
}

export async function concluirSessao(id: string, volumeTotalKg: number, duracaoSeg: number) {
  const { error } = await supabase
    .from('sessoes_concluidas')
    .update({ finalizada_em: new Date().toISOString(), volume_total_kg: volumeTotalKg, duracao_seg: duracaoSeg })
    .eq('id', id)
  if (error) throw error
}

/** Datas de todas as sessões que o usuário já concluiu, pra calcular consistência. */
export async function buscarDatasSessoesConcluidas(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('sessoes_concluidas')
    .select('finalizada_em')
    .eq('user_id', userId)
    .not('finalizada_em', 'is', null)
  if (error) throw error
  return (data ?? []).map((s) => s.finalizada_em as string)
}

/** Ids dos exercícios que o usuário já registrou alguma carga, mais recente primeiro. */
export async function buscarExerciciosTreinados(userId: string): Promise<number[]> {
  const { data, error } = await supabase
    .from('registros')
    .select('exercicio_id, data')
    .eq('user_id', userId)
    .order('data', { ascending: false })
  if (error) throw error
  const vistos = new Set<number>()
  const ordenados: number[] = []
  for (const r of data ?? []) {
    if (!vistos.has(r.exercicio_id)) {
      vistos.add(r.exercicio_id)
      ordenados.push(r.exercicio_id)
    }
  }
  return ordenados
}

/** Histórico completo de um exercício, do mais antigo pro mais recente. */
export async function buscarHistoricoExercicio(userId: string, exercicioId: number): Promise<RegistroDB[]> {
  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .eq('user_id', userId)
    .eq('exercicio_id', exercicioId)
    .order('data', { ascending: true })
  if (error) throw error
  return data ?? []
}
