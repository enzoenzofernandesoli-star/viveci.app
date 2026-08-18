import { useEffect, useState } from 'react'
import { supabase } from '../supabase.ts'
import { buscarSeguindoIds } from './seguidores.ts'
import { TAMANHO_MAX_POST, validarImagem } from '../uploadSeguro.ts'
import { LIMITE_COMENTARIO, LIMITE_LEGENDA, validarTextoSocial } from './limites.ts'

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
  foto_path: string | null
  treino_nome: string | null
  treino_duracao_seg: number | null
  treino_series: number | null
  treino_volume_kg: number | null
}

// ─────────────────────────────────────────────────────────────
// PONTO DE TROCA PARA O SUPABASE — tabelas `posts`, `post_likes`,
// `post_comments`. Sem conta privada nessa primeira versão: qualquer
// usuário autenticado lê qualquer post (RLS só restringe escrita).
// ─────────────────────────────────────────────────────────────

/** Monta os posts brutos com autor, curtidas, comentários e resumo de treino — tudo em lote, sem N+1. */
const POSTS_POR_PAGINA = 15

async function montarPosts(postsBrutos: PostBruto[], meuId: string): Promise<Post[]> {
  if (postsBrutos.length === 0) return []

  const idsUsuarios = [...new Set(postsBrutos.map((p) => p.user_id))]
  const idsPosts = postsBrutos.map((p) => p.id)
  const [{ data: perfis }, { data: likes }, { data: comentarios }] = await Promise.all([
    supabase.from('perfis_publicos').select('id, nome, foto_url').in('id', idsUsuarios),
    supabase.from('post_likes').select('post_id, user_id').in('post_id', idsPosts),
    supabase.from('post_comments').select('post_id').in('post_id', idsPosts),
  ])

  const perfilPorId = new Map((perfis ?? []).map((p) => [p.id, p]))

  return postsBrutos.map((p) => {
    const likesDoPost = (likes ?? []).filter((l) => l.post_id === p.id)
    const perfilAutor = perfilPorId.get(p.user_id)
    const resumoTreino: ResumoTreino | null = p.sessao_concluida_id && p.treino_nome
      ? {
          nome: p.treino_nome,
          duracaoSeg: p.treino_duracao_seg,
          volumeTotalKg: p.treino_volume_kg,
          numeroSeries: p.treino_series ?? 0,
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

function useListaDePosts(carregarBrutos: (inicio: number, fim: number) => Promise<PostBruto[]>, meuId: string | undefined, deps: unknown[]) {
  const [posts, setPosts] = useState<Post[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [temMais, setTemMais] = useState(false)

  useEffect(() => {
    if (!meuId) {
      setCarregando(false)
      return
    }
    let cancelado = false
    setCarregando(true)
    setErro(null)

    carregarBrutos(pagina * POSTS_POR_PAGINA, (pagina + 1) * POSTS_POR_PAGINA - 1)
      .then((brutos) => montarPosts(brutos, meuId))
      .then((montados) => {
        if (!cancelado) {
          setTemMais(montados.length === POSTS_POR_PAGINA)
          setPosts((atuais) => pagina === 0 ? montados : [...atuais, ...montados.filter((post) => !atuais.some((atual) => atual.id === post.id))])
        }
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
  }, [meuId, versao, pagina, ...deps])

  return {
    posts,
    carregando,
    erro,
    temMais,
    carregarMais: () => setPagina((atual) => atual + 1),
    recarregar: () => { setPagina(0); setVersao((v) => v + 1) },
  }
}

/** Feed "Amigos": posts de quem o usuário segue + os próprios. */
export function useFeedAmigos(meuId: string | undefined) {
  return useListaDePosts(
    async (inicio, fim) => {
      const seguindoIds = await buscarSeguindoIds(meuId!)
      const idsFeed = [...seguindoIds, meuId!]
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('user_id', idsFeed)
        .order('criado_em', { ascending: false })
        .range(inicio, fim)
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
    async (inicio, fim) => {
      const { data, error } = await supabase.from('posts').select('*').order('criado_em', { ascending: false }).range(inicio, fim)
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
    async (inicio, fim) => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userIdAlvo!)
        .order('criado_em', { ascending: false })
        .range(inicio, fim)
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
  let fotoPath: string | null = null
  if (dados.arquivoFoto) {
    const { extensao } = validarImagem(dados.arquivoFoto, TAMANHO_MAX_POST)
    const caminho = `${userId}/social/${Date.now()}.${extensao}`
    const { error: erroUpload } = await supabase.storage.from('midia-publica').upload(caminho, dados.arquivoFoto, { contentType: dados.arquivoFoto.type })
    if (erroUpload) throw erroUpload
    fotoUrl = supabase.storage.from('midia-publica').getPublicUrl(caminho).data.publicUrl
    fotoPath = caminho
  }

  const { error } = await supabase.from('posts').insert({
    user_id: userId,
    legenda: validarTextoSocial(dados.legenda, LIMITE_LEGENDA, 'Legenda') || null,
    foto_url: fotoUrl,
    foto_path: fotoPath,
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

export async function excluirPost(postId: string) {
  const { data: post, error: erroBusca } = await supabase.from('posts').select('foto_path').eq('id', postId).single()
  if (erroBusca) throw erroBusca
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
  if (post.foto_path) await supabase.storage.from('midia-publica').remove([post.foto_path])
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
          .limit(100)
        if (error) throw error

        const idsAutores = [...new Set((comentariosBrutos ?? []).map((c) => c.user_id))]
        const { data: perfis } =
          idsAutores.length > 0 ? await supabase.from('perfis_publicos').select('id, nome, foto_url').in('id', idsAutores) : { data: [] }
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
  const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, texto: validarTextoSocial(texto, LIMITE_COMENTARIO, 'Comentário') })
  if (error) throw error
}

export async function excluirComentario(comentarioId: string) {
  const { error } = await supabase.from('post_comments').delete().eq('id', comentarioId)
  if (error) throw error
}
