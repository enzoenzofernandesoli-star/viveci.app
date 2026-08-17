import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'

export type Tema = 'claro' | 'escuro' | 'sistema'

export type Preferencias = {
  duracao_treino_preferida_min: number | null
  horario_treino_preferido: string | null
  dias_treino_preferidos: number[]
  equipamentos_disponiveis: string[]
  exercicios_excluidos: number[]
  notif_lembrete_treino: boolean
  notif_horario_treino: boolean
  notif_treino_recomendado: boolean
  notif_lembrete_alimentacao: boolean
  notif_novo_pr: boolean
  notif_resumo_semanal: boolean
  notif_recomendacoes: boolean
  notif_inteligentes: boolean
  notif_inicio: string
  notif_fim: string
  nutricao_mostrar_kcal: boolean
  nutricao_mostrar_proteina: boolean
  nutricao_mostrar_carboidrato: boolean
  nutricao_mostrar_gordura: boolean
  tema: Tema
  animacoes: boolean
  reduzir_movimento: boolean
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  duracao_treino_preferida_min: null,
  horario_treino_preferido: null,
  dias_treino_preferidos: [],
  equipamentos_disponiveis: [],
  exercicios_excluidos: [],
  notif_lembrete_treino: true,
  notif_horario_treino: true,
  notif_treino_recomendado: true,
  notif_lembrete_alimentacao: false,
  notif_novo_pr: true,
  notif_resumo_semanal: true,
  notif_recomendacoes: true,
  notif_inteligentes: true,
  notif_inicio: '08:00',
  notif_fim: '22:00',
  nutricao_mostrar_kcal: true,
  nutricao_mostrar_proteina: true,
  nutricao_mostrar_carboidrato: true,
  nutricao_mostrar_gordura: true,
  tema: 'sistema',
  animacoes: true,
  reduzir_movimento: false,
}

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabela `preferencias_usuario`
// Sem linha ainda, o usuário está nos valores padrão (nunca null na UI).
// ─────────────────────────────────────────────────────────────

/** Preferências do usuário — cai nos padrões se ele nunca configurou nada. */
export function usePreferencias(userId: string | undefined) {
  const [preferencias, setPreferencias] = useState<Preferencias>(PREFERENCIAS_PADRAO)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!userId) {
      setCarregando(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    setErro(null)
    supabase
      .from('preferencias_usuario')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) setErro(error.message)
        else if (data) setPreferencias({ ...PREFERENCIAS_PADRAO, ...data })
        setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId, versao])

  return { preferencias, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

export async function salvarPreferencias(userId: string, dados: Partial<Preferencias>) {
  const { error } = await supabase.from('preferencias_usuario').upsert({ user_id: userId, ...dados })
  if (error) throw error
}
