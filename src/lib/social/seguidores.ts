import { useEffect, useState } from 'react'
import { supabase } from '../supabase.ts'

export type PessoaSocial = {
  id: string
  nome: string | null
  foto_url: string | null
  bio: string | null
}

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabela `seguidores`
// Sem conta privada nessa primeira versão: seguir é imediato, sem aprovação.
// ─────────────────────────────────────────────────────────────

export async function seguir(seguidorId: string, seguidoId: string) {
  const { error } = await supabase.from('seguidores').insert({ seguidor_id: seguidorId, seguido_id: seguidoId })
  if (error) throw error
}

export async function deixarDeSeguir(seguidorId: string, seguidoId: string) {
  const { error } = await supabase.from('seguidores').delete().eq('seguidor_id', seguidorId).eq('seguido_id', seguidoId)
  if (error) throw error
}

/** IDs de todos que o usuário segue — usado pra montar o feed de Amigos. */
export async function buscarSeguindoIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('seguidores').select('seguido_id').eq('seguidor_id', userId)
  if (error) throw error
  return (data ?? []).map((r) => r.seguido_id as string)
}

/** Se `meuId` segue `userIdAlvo`, mais contadores reais de seguidores/seguindo do alvo. */
export function useRelacaoSocial(userIdAlvo: string | undefined, meuId: string | undefined) {
  const [seguindo, setSeguindo] = useState(false)
  const [seguidores, setSeguidores] = useState(0)
  const [seguindoTotal, setSeguindoTotal] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!userIdAlvo) {
      setCarregando(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    setErro(null)

    async function carregar() {
      try {
        const [{ count: countSeguidores, error: erroA }, { count: countSeguindo, error: erroB }, relacao] =
          await Promise.all([
            supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguido_id', userIdAlvo!),
            supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguidor_id', userIdAlvo!),
            meuId
              ? supabase.from('seguidores').select('*').eq('seguidor_id', meuId).eq('seguido_id', userIdAlvo!).maybeSingle()
              : Promise.resolve({ data: null, error: null }),
          ])
        if (erroA) throw erroA
        if (erroB) throw erroB
        if (relacao.error) throw relacao.error

        if (!cancelado) {
          setSeguidores(countSeguidores ?? 0)
          setSeguindoTotal(countSeguindo ?? 0)
          setSeguindo(!!relacao.data)
        }
      } catch (err) {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra carregar.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [userIdAlvo, meuId, versao])

  return { seguindo, seguidores, seguindoTotal, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

export function useConexoesSociais(userId: string | undefined, tipo: 'seguidores' | 'seguindo') {
  const [pessoas, setPessoas] = useState<PessoaSocial[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) { setCarregando(false); return }
    let cancelado = false
    setCarregando(true)
    setErro(null)

    async function carregar() {
      try {
        const colunaFiltro = tipo === 'seguidores' ? 'seguido_id' : 'seguidor_id'
        const colunaPessoa = tipo === 'seguidores' ? 'seguidor_id' : 'seguido_id'
        const { data: relacoes, error: erroRelacoes } = await supabase
          .from('seguidores').select(`${colunaPessoa}`).eq(colunaFiltro, userId!)
        if (erroRelacoes) throw erroRelacoes

        const ids = (relacoes ?? []).map((item) => (item as Record<string, unknown>)[colunaPessoa] as string)
        if (ids.length === 0) {
          if (!cancelado) setPessoas([])
          return
        }
        const { data: perfis, error: erroPerfis } = await supabase
          .from('perfis_publicos').select('id, nome, foto_url, bio').in('id', ids)
        if (erroPerfis) throw erroPerfis
        if (!cancelado) {
          const ordem = new Map(ids.map((id, indice) => [id, indice]))
          setPessoas((perfis as PessoaSocial[]).sort((a, b) => (ordem.get(a.id) ?? 0) - (ordem.get(b.id) ?? 0)))
        }
      } catch (err) {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra carregar as pessoas.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => { cancelado = true }
  }, [userId, tipo])

  return { pessoas, carregando, erro }
}
