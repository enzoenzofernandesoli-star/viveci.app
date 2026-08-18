import { useEffect, useState } from 'react'
import { supabase } from './supabase.ts'
import { TAMANHO_MAX_PROGRESSO, validarImagem } from './uploadSeguro.ts'

export const ANGULOS = ['Frente', 'Lateral', 'Costas'] as const
export type Angulo = (typeof ANGULOS)[number]

export type FotoProgresso = {
  id: string
  data: string // AAAA-MM-DD
  angulo: Angulo
  url: string
  storage_bucket?: string | null
  storage_path?: string | null
}

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabela `fotos_progresso` (já existia na
// estrutura original, criada em sql/01_estrutura.sql) + bucket privado.
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
      .then(async ({ data, error }) => {
        if (cancelado) return
        if (error) setErro(error.message)
        else {
          const linhas = (data ?? []) as FotoProgresso[]
          const resolvidas = await Promise.all(linhas.map(async (foto) => {
            if (!foto.storage_path) return foto
            const bucket = foto.storage_bucket ?? 'progresso-privado'
            const { data: assinada, error: erroUrl } = await supabase.storage.from(bucket).createSignedUrl(foto.storage_path, 60 * 60)
            return erroUrl ? { ...foto, url: '' } : { ...foto, url: assinada.signedUrl }
          }))
          setFotos(resolvidas)
        }
        setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId, versao])

  return { fotos, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

/** Sobe a foto no bucket privado e registra apenas o path permanente. */
export async function enviarFotoProgresso(userId: string, angulo: Angulo, arquivo: File): Promise<FotoProgresso> {
  const { extensao } = validarImagem(arquivo, TAMANHO_MAX_PROGRESSO)
  const hojeISO = new Date().toISOString().slice(0, 10)
  const caminho = `${userId}/body/${angulo}-${Date.now()}.${extensao}`
  const bucket = 'progresso-privado'

  const { error: erroUpload } = await supabase.storage.from(bucket).upload(caminho, arquivo, { upsert: false, contentType: arquivo.type })
  if (erroUpload) throw erroUpload

  const { data: urlData, error: erroUrl } = await supabase.storage.from(bucket).createSignedUrl(caminho, 60 * 60)
  if (erroUrl) {
    await supabase.storage.from(bucket).remove([caminho])
    throw erroUrl
  }

  const { data, error } = await supabase
    .from('fotos_progresso')
    .insert({ user_id: userId, data: hojeISO, angulo, url: '', storage_bucket: bucket, storage_path: caminho })
    .select()
    .single()
  if (error) {
    await supabase.storage.from(bucket).remove([caminho])
    throw error
  }

  return { ...(data as FotoProgresso), url: urlData.signedUrl }
}

export async function excluirFotoProgresso(id: string) {
  const { data: foto, error: erroBusca } = await supabase.from('fotos_progresso').select('storage_bucket, storage_path').eq('id', id).single()
  if (erroBusca) throw erroBusca
  if (foto.storage_path) {
    const { error: erroStorage } = await supabase.storage.from(foto.storage_bucket ?? 'progresso-privado').remove([foto.storage_path])
    if (erroStorage) throw erroStorage
  }
  const { error } = await supabase.from('fotos_progresso').delete().eq('id', id)
  if (error) throw error
}
