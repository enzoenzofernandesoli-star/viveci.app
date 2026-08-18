import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Page } from '../components/Page'
import { Empty } from '../components/Empty'
import { PostCard } from '../components/PostCard'
import { ComentariosPost } from '../components/ComentariosPost'
import { useSessao } from '../lib/auth'
import { usePerfilPublico } from '../lib/perfil'
import { usePostsDoUsuario } from '../lib/social/posts'
import { useRelacaoSocial, seguir, deixarDeSeguir } from '../lib/social/seguidores'

export default function PerfilPublico() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { sessao } = useSessao()
  const meuId = sessao?.user.id
  const [comentandoPostId, setComentandoPostId] = useState<string | null>(null)
  const [enviandoFollow, setEnviandoFollow] = useState(false)

  const { perfil, carregando: carregandoPerfil } = usePerfilPublico(id)
  const { posts, carregando: carregandoPosts, recarregar: recarregarPosts } = usePostsDoUsuario(id, meuId)
  const { seguindo, seguidores, seguindoTotal, carregando: carregandoRelacao, recarregar } = useRelacaoSocial(id, meuId)

  if (!meuId || !id) {
    return (
      <Page title="Perfil">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  if (comentandoPostId) {
    return <ComentariosPost postId={comentandoPostId} meuId={meuId} onFechar={() => setComentandoPostId(null)} />
  }

  async function alternarSeguir() {
    setEnviandoFollow(true)
    try {
      if (seguindo) await deixarDeSeguir(meuId!, id!)
      else await seguir(meuId!, id!)
      recarregar()
    } finally {
      setEnviandoFollow(false)
    }
  }

  return (
    <div className="animar-entrada mx-auto max-w-[640px] pb-4">
      <div className="flex min-h-14 items-center gap-3 border-b border-line/60">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="flex size-11 items-center justify-center text-ink-2 hover:text-ink">
          <ChevronLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="text-lg font-semibold">Perfil</h1>
      </div>

      {carregandoPerfil ? (
        <Empty text="Carregando..." />
      ) : !perfil ? (
        <Empty text="Usuário não encontrado." />
      ) : (
        <>
          <div className="mt-8 text-center">
            <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border border-line bg-card-hover">
              {perfil.foto_url ? (
                <img src={perfil.foto_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-ink-3">
                  {perfil.nome?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>
            <h2 className="mt-5 truncate text-2xl font-semibold tracking-[-0.045em]">{perfil.nome}</h2>
            {perfil.bio && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-2">{perfil.bio}</p>}
          </div>

          <div className="mt-6 grid grid-cols-3 divide-x divide-line/60 border-y border-line/60 py-4 text-center">
            <div>
              <p className="num text-xl font-semibold">{posts.length}</p>
              <p className="text-xs text-ink-2">Publicações</p>
            </div>
            <div>
              <p className="num text-xl font-semibold">{carregandoRelacao ? '—' : seguidores}</p>
              <p className="text-xs text-ink-2">Seguidores</p>
            </div>
            <div>
              <p className="num text-xl font-semibold">{carregandoRelacao ? '—' : seguindoTotal}</p>
              <p className="text-xs text-ink-2">Seguindo</p>
            </div>
          </div>

          {id !== meuId && (
            <button
              onClick={alternarSeguir}
              disabled={enviandoFollow || carregandoRelacao}
              className={`mt-4 h-11 w-full rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                seguindo ? 'border border-line text-ink-2 hover:bg-card-hover' : 'bg-brand text-white hover:bg-brand-hover'
              }`}
            >
              {seguindo ? 'Seguindo' : 'Seguir'}
            </button>
          )}

          <div className="mt-8">
            <p className="border-b border-line/60 pb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Publicações</p>
            {carregandoPosts ? (
              <Empty text="Carregando publicações..." />
            ) : posts.length === 0 ? (
              <Empty text="Nenhuma publicação ainda." />
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  meuId={meuId}
                  onAbrirComentarios={setComentandoPostId}
                  onAbrirAutor={() => {}}
                  onRemovido={recarregarPosts}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
