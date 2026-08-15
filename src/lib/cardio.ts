import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'

export const EQUIPAMENTOS_CARDIO = [
  'Esteira',
  'Bicicleta',
  'Elíptico',
  'Escada',
  'Remo',
  'Bike spinning',
] as const

export type EquipamentoCardio = (typeof EQUIPAMENTOS_CARDIO)[number]

export type CardioDB = {
  id: string
  user_id: string
  equipamento: string
  duracao_min: number
  distancia_km: number | null
  data: string
}

export type NovoCardio = {
  equipamento: EquipamentoCardio
  duracao_min: number
  distancia_km: number | null
}

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabela `cardio_sessoes`
// ─────────────────────────────────────────────────────────────

export function useHistoricoCardio(userId: string | undefined) {
  const [sessoes, setSessoes] = useState<CardioDB[]>([])
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
      .from('cardio_sessoes')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) setErro(error.message)
        else setSessoes(data ?? [])
        setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId, versao])

  return { sessoes, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

export async function registrarCardio(userId: string, dados: NovoCardio) {
  const { error } = await supabase.from('cardio_sessoes').insert({ user_id: userId, ...dados })
  if (error) throw error
}

export async function removerCardio(id: string) {
  const { error } = await supabase.from('cardio_sessoes').delete().eq('id', id)
  if (error) throw error
}
