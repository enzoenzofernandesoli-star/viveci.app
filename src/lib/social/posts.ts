import { useEffect, useState } from 'react'
import { supabase } from '../supabase.ts'
import { buscarSeguindoIds } from './seguidores.ts'

export type Autor = { id: string; nome: string; fotoUrl: string | null }

export type ResumoTreino = {
  nome: string
  duracaoSeg: number | null
  volumeTotalKg: number | null
  numeroSeries: number
}

export type Post = {
  id: string
  legenda: string | null
  fotoUrl: string | null
  criadoEm: string
  autor: Autor
  contagemCurtidas: number
  curtiPorMim: boolean
  contagemComentarios: number
  resumoTreino: ResumoTreino | null
  mostrarDuracao: boolean
  mostrarSeries: boolean
  mostrarVolume: boolean
}

type PostBruto = {
  id: string
  user_id: string
  legenda: string | null
  foto_url: string | null
  sessao_concluida_id: string | null
  mostrar_duracao: boolean
  mostrar_series: boolean
  mostrar_volume: boolean
  criado_em: string
}

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabelas `posts`, `post_likes`,
// `post_comments`. Sem conta privada nessa primeira versão: qualquer
// usuário autenticado lê qualquer post (RLS só restringe escrita).
// ─────────────────────────────────────────────────────────────

/** Monta os posts brutos com autor, curtidas, comentários e resumo de treino — tudo em lote, sem N+1. */
async function montarPosts(postsBrutos: PostBruto[], meuId: string): Promise<Post[]> {
  if (postsBrutos.length === 0) return []

  const idsUsuarios = [...new Set(postsBrutos.map((p) => p.user_id))]
  const idsPosts = postsBrutos.map((p) => p.id)
  const idsSessao = [...new Set(postsBrutos.map((p) => p.sessao_concluida_id).filter((id): id is string => id !== null))]

  const [{ data: perfis }, { data: likes }, { data: comentarios }, { data: sessoes }] = await Promise.all([
    supabase.from('perfis').select('id, nome, foto_url').in('id', idsUsuarios),
    supabase.from('post_likes').select('post_id, user_id').in('post_id', idsPosts),
    supabase.from('post_comments').select('post_id').in('post_id', idsPosts),
    idsSessao.length > 0
      ? supabase.from('sessoes_concluidas').select('id, sessao_id, volume_total_kg, duracao_seg').in('id', idsSessao)
      : Promise.resolve({ data: [] as { id: string; sessao_id: string | null; volume_total_kg: number | null; duracao_seg: number | null }[] }),
  ])

  const idsPlanoSessao = [...new Set((sessoes ?? []).map((s) => s.sessao_id).filter((id): id is string => id !== null))]
  const { data: planoSessoes } =
    idsPlanoSessao.length > 0
      ? await supabase.from('plano_sessoes').select('id, plano_id, nome_sessao').in('id', idsPlanoSessao)
      : { data: [] as { id: string; plano_id: string; nome_sessao: string | null }[] }

  const idsPlano = [...new Set((planoSessoes ?? []).map((s) => s.plano_id))]
  const { data: planos } = idsPlano.length > 0 ? await supabase.from('planos').select('id, nome').in('id', idsPlano) : { data: [] as { id: string; nome: string }[] }

  const { data: registrosContagem } =
    idsSessao.length > 0
      ? await supabase.from('registros').select('sessao_id').in('sessao_id', (sessoes ?? []).map((s) => s.sessao_id).filter((id): id is string => id !== null))
      : { data: [] as { sessao_id: string | null }[] }

  const perfilPorId = new Map((perfis ?? []).map((p) => [p.id, p]))
  const nomePorPlano = new Map((planos ?? []).map((p) => [p.id, p.nome as string]))
  const nomePorPlanoSessao = new Map((planoSessoes ?? []).map((s) => [s.id, nomePorPlano.get(s.plano_id) ?? 'Treino']))
  const sessaoConcluidaPorId = new Map((sessoes ?? []).map((s) => [s.id, s]))
  const seriesPorSessaoId = new Map<string, number>()
  for (const r of registrosContagem ?? []) {
    if (!r.sessao_id) continue
    seriesPorSessaoId.set(r.sessao_id, (seriesPorSessaoId.get(r.sessao_id) ?? 0) + 1)
  }

  return postsBrutos.map((p) => {
    const likesDoPost = (likes ?? []).filter((l) => l.post_id === p.id)
    const perfilAutor = perfilPorId.get(p.user_id)
    const sessaoConcluida = p.sessao_concluida_id ? sessaoConcluidaPorId.get(p.sessao_concluida_id) : undefined

    const resumoTreino: ResumoTreino | null = sessaoConcluida
      ? {
          nome: sessaoConcluida.sessao_id ? (nomePorPlanoSessao.get(sessaoConcluida.sessao_id) ?? 'Treino rápido') : 'Treino rápido',
          duracaoSeg: sessaoConcluida.duracao_seg,
          volumeTotalKg: sessaoConcluida.volume_total_kg,
          numeroSeries: sessaoConcluida.sessao_id ? (seriesPorSessaoId.get(sessaoConcluida.sessao_id) ?? 0) : 0,
        }
      : null

    return {
      id: p.id,
      legenda: p.legenda,
      fotoUrl: p.foto_url,
      criadoEm: p.criado_em,
      autor: { id: p.user_id, nome: perfilAutor?.nome ?? 'Usuário', fotoUrl: perfilAutor?.foto_url ?? null },
      contagemCurtidas: likesDoPost.length,
      curtiPorMim: likesDoPost.some((l) => l.user_id === meuId),
      contagemComentarios: (comentarios ?? []).filter((c) => c.post_id === p.id).length,
      resumoTreino,
      mostrarDuracao: p.mostrar_duracao,
      mostrarSeries: p.mostrar_series,
      mostrarVolume: p.mostrar_volume,
    }
  })
}

function useListaDePosts(carregarBrutos: () => Promise<PostBruto[]>, meuId: string | undefined, deps: unknown[]) {
  const [posts, setPosts] = useState<Post[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!meuId) {
      setCarregando(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    setErro(null)

    carregarBrutos()
      .then((brutos) => montarPosts(brutos, meuId))
      .then((montados) => {
        if (!cancelado) setPosts(montados)
      })
      .catch((err) => {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra carregar o feed.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meuId, versao, ...deps])

  return { posts, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

/** Feed "Amigos": posts de quem o usuário segue + os próprios. */
export function useFeedAmigos(meuId: string | undefined) {
  return useListaDePosts(
    async () => {
      const seguindoIds = await buscarSeguindoIds(meuId!)
      const idsFeed = [...seguindoIds, meuId!]
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('user_id', idsFeed)
        .order('criado_em', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as PostBruto[]
    },
    meuId,
    [],
  )
}

/** Feed "Descobrir": posts públicos recentes de todo mundo, sem algoritmo de recomendação ainda. */
export function useFeedDescobrir(meuId: string | undefined) {
  return useListaDePosts(
    async () => {
      const { data, error } = await supabase.from('posts').select('*').order('criado_em', { ascending: false }).limit(50)
      if (error) throw error
      return (data ?? []) as PostBruto[]
    },
    meuId,
    [],
  )
}

/** Posts de um usuário específico — usado no perfil público. */
export function usePostsDoUsuario(userIdAlvo: string | undefined, meuId: string | undefined) {
  return useListaDePosts(
    async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userIdAlvo!)
        .order('criado_em', { ascending: false })
      if (error) throw error
      return (data ?? []) as PostBruto[]
    },
    meuId,
    [userIdAlvo],
  )
}

export async function criarPost(
  userId: string,
  dados: {
    legenda: string
    arquivoFoto: File | null
    sessaoConcluidaId: string | null
    mostrarDuracao: boolean
    mostrarSeries: boolean
    mostrarVolume: boolean
  },
) {
  let fotoUrl: string | null = null
  if (dados.arquivoFoto) {
    const extensao = dados.arquivoFoto.name.split('.').pop() ?? 'jpg'
    const caminho = `${userId}/social/${Date.now()}.${extensao}`
    const { error: erroUpload } = await supabase.storage.from('Fotos').upload(caminho, dados.arquivoFoto)
    if (erroUpload) throw erroUpload
    fotoUrl = supabase.storage.from('Fotos').getPublicUrl(caminho).data.publicUrl
  }

  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    legenda: dados.legenda || null,
    foto_url: fotoUrl,
    sessao_concluida_id: dados.sessaoConcluidaId,
    mostrar_duracao: dados.mostrarDuracao,
    mostrar_series: dados.mostrarSeries,
    mostrar_volume: dados.mostrarVolume,
  })
  if (error) throw error
}

export async function curtir(postId: string, userId: string) {
  const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
  if (error) throw error
}

export async function descurtir(postId: string, userId: string) {
  const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
  if (error) throw error
}

export type Comentario = {
  id: string
  texto: string
  criadoEm: string
  autor: Autor
}

export function useComentarios(postId: string | undefined) {
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!postId) {
      setCarregando(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    setErro(null)

    async function carregar() {
      try {
        const { data: comentariosBrutos, error } = await supabase
          .from('post_comments')
          .select('id, texto, criado_em, user_id')
          .eq('post_id', postId!)
          .order('criado_em', { ascending: true })
        if (error) throw error

        const idsAutores = [...new Set((comentariosBrutos ?? []).map((c) => c.user_id))]
        const { data: perfis } =
          idsAutores.length > 0 ? await supabase.from('perfis').select('id, nome, foto_url').in('id', idsAutores) : { data: [] }
        const perfilPorId = new Map((perfis ?? []).map((p) => [p.id, p]))

        if (!cancelado) {
          setComentarios(
            (comentariosBrutos ?? []).map((c) => ({
              id: c.id,
              texto: c.texto,
              criadoEm: c.criado_em,
              autor: {
                id: c.user_id,
                nome: perfilPorId.get(c.user_id)?.nome ?? 'Usuário',
                fotoUrl: perfilPorId.get(c.user_id)?.foto_url ?? null,
              },
            })),
          )
        }
      } catch (err) {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Não deu pra carregar os comentários.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [postId, versao])

  return { comentarios, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

export async function comentar(postId: string, userId: string, texto: string) {
  const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, texto })
  if (error) throw error
}
