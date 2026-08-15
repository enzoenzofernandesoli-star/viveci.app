import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'

export type MedidaDB = {
  id: string
  user_id: string
  data: string
  peso_kg: number | null
  gordura_pct: number | null
  peitoral: number | null
  cintura: number | null
  quadril: number | null
  braco_d: number | null
  coxa_d: number | null
}

export type NovaMedida = {
  peso_kg?: number | null
  gordura_pct?: number | null
  peitoral?: number | null
  cintura?: number | null
  quadril?: number | null
  braco_d?: number | null
  coxa_d?: number | null
}

/** Histórico de peso e medidas do usuário, do mais antigo pro mais recente. */
export function useMedidas(userId: string | undefined) {
  const [medidas, setMedidas] = useState<MedidaDB[]>([])
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
      .from('medidas')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: true })
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) setErro(error.message)
        else setMedidas(data ?? [])
        setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId, versao])

  const recarregar = () => setVersao((v) => v + 1)

  return { medidas, carregando, erro, recarregar }
}

export async function adicionarMedida(userId: string, dados: NovaMedida) {
  const { error } = await supabase.from('medidas').insert({ user_id: userId, ...dados })
  if (error) throw error
}
