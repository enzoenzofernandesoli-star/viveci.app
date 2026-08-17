import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'

export const ANGULOS = ['Frente', 'Lateral', 'Costas'] as const
export type Angulo = (typeof ANGULOS)[number]

export type FotoProgresso = {
  id: string
  data: string // AAAA-MM-DD
  angulo: Angulo
  url: string
}

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabela `fotos_progresso` (já existia na
// estrutura original, criada em sql/01_estrutura.sql) + bucket `Fotos`.
// ─────────────────────────────────────────────────────────────

/** Fotos de progresso do usuário, mais recentes primeiro. */
export function useFotosProgresso(userId: string | undefined) {
  const [fotos, setFotos] = useState<FotoProgresso[]>([])
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
      .from('fotos_progresso')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) setErro(error.message)
        else setFotos((data ?? []) as FotoProgresso[])
        setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId, versao])

  return { fotos, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

/** Sobe a foto pro bucket `Fotos` e registra a linha em `fotos_progresso`. */
export async function enviarFotoProgresso(userId: string, angulo: Angulo, arquivo: File): Promise<FotoProgresso> {
  const extensao = arquivo.name.split('.').pop() ?? 'jpg'
  const hojeISO = new Date().toISOString().slice(0, 10)
  const caminho = `${userId}/body/${angulo}-${Date.now()}.${extensao}`

  const { error: erroUpload } = await supabase.storage.from('Fotos').upload(caminho, arquivo, { upsert: true })
  if (erroUpload) throw erroUpload

  const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(caminho)

  const { data, error } = await supabase
    .from('fotos_progresso')
    .insert({ user_id: userId, data: hojeISO, angulo, url: urlData.publicUrl })
    .select()
    .single()
  if (error) throw error

  return data as FotoProgresso
}

export async function excluirFotoProgresso(id: string) {
  const { error } = await supabase.from('fotos_progresso').delete().eq('id', id)
  if (error) throw error
}
