import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { TAMANHO_MAX_AVATAR, validarImagem } from './uploadSeguro'
import type { Plano } from './planos'

export type Sexo = 'masculino' | 'feminino'

export type Objetivo =
  | 'emagrecer'
  | 'definir'
  | 'condicionamento'
  | 'forca'
  | 'ganhar_massa'

export type Perfil = {
  nome: string
  sexo: Sexo
  idade: number
  altura_cm: number
  peso_kg: number
  dias_semana: number
  objetivo: Objetivo
}

export const ROTULO_OBJETIVO: Record<Objetivo, string> = {
  emagrecer: 'Emagrecer',
  definir: 'Definir',
  condicionamento: 'Melhorar condicionamento',
  forca: 'Aumentar força',
  ganhar_massa: 'Ganhar massa',
}

export type Nivel = 'iniciante' | 'intermediario' | 'avancado'

export const ROTULO_NIVEL: Record<Nivel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

/** Linha da tabela `perfis`. Campos ficam nulos até o onboarding preenchê-los.
 * nivel/local_treino/tempo_sessao_min/biotipo não são mais coletados no onboarding
 * (eram só pro gerador automático de treino, que saiu) — a coluna continua existindo
 * no banco, mas fica sempre nula por enquanto. */
export type PerfilDB = {
  id: string
  nome: string | null
  foto_url: string | null
  bio: string | null
  sexo: Sexo | null
  idade: number | null
  altura_cm: number | null
  peso_kg: number | null
  objetivo: Objetivo | null
  nivel: Nivel | null
  local_treino: string | null
  dias_semana: number | null
  tempo_sessao_min: number | null
  biotipo: string | null
  onboarding_completo: boolean
  plano: Plano
  criado_em: string
}

export type PerfilPublico = Pick<PerfilDB, 'id' | 'nome' | 'foto_url' | 'bio'>

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabela `perfis`
// ─────────────────────────────────────────────────────────────

/** Perfil do usuário logado. Reage a troca de sessão. */
export function usePerfil(userId: string | undefined) {
  const [perfil, setPerfil] = useState<PerfilDB | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!userId) {
      setPerfil(null)
      setCarregando(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    setErro(null)
    supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) setErro(error.message)
        else setPerfil(data)
        setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId, versao])

  return { perfil, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

export function usePerfilPublico(userId: string | undefined) {
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!userId) { setPerfil(null); setCarregando(false); return }
    let cancelado = false
    setCarregando(true)
    supabase.from('perfis_publicos').select('id, nome, foto_url, bio').eq('id', userId).maybeSingle().then(({ data }) => {
      if (!cancelado) { setPerfil(data as PerfilPublico | null); setCarregando(false) }
    })
    return () => { cancelado = true }
  }, [userId])

  return { perfil, carregando }
}

export async function atualizarPerfil(userId: string, dados: Partial<PerfilDB>) {
  const { error } = await supabase.from('perfis').update(dados).eq('id', userId)
  if (error) throw error
}

/** Sobe a foto de perfil pro bucket `Fotos` e já salva a URL em `perfis.foto_url`. */
export async function enviarFotoPerfil(userId: string, arquivo: File): Promise<string> {
  const { extensao } = validarImagem(arquivo, TAMANHO_MAX_AVATAR)
  const caminho = `${userId}/avatar/avatar-${Date.now()}.${extensao}`

  const { error: erroUpload } = await supabase.storage.from('midia-publica').upload(caminho, arquivo, {
    upsert: false,
    cacheControl: '3600',
    contentType: arquivo.type,
  })
  if (erroUpload) throw erroUpload

  const { data } = supabase.storage.from('midia-publica').getPublicUrl(caminho)
  const url = `${data.publicUrl}?v=${Date.now()}`
  try {
    await atualizarPerfil(userId, { foto_url: url })
  } catch (erro) {
    await supabase.storage.from('midia-publica').remove([caminho])
    throw erro
  }
  const { data: anteriores } = await supabase.storage.from('midia-publica').list(`${userId}/avatar`)
  const obsoletos = (anteriores ?? []).filter((item) => item.name !== caminho.split('/').at(-1)).map((item) => `${userId}/avatar/${item.name}`)
  if (obsoletos.length > 0) await supabase.storage.from('midia-publica').remove(obsoletos)
  return url
}
