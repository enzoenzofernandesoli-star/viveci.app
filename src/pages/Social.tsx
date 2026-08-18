import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Empty } from '../components/Empty'
import { PostCard } from '../components/PostCard'
import { ComentariosPost } from '../components/ComentariosPost'
import { CriarPost } from '../components/CriarPost'
import { CardDesafioInicial } from '../components/CardDesafioInicial'
import { useSessao } from '../lib/auth'
import { useFeedAmigos, useFeedDescobrir } from '../lib/social/posts'

export default function Social() {
  const { sessao } = useSessao()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const userId = sessao?.user.id
  const [aba, setAba] = useState<'amigos' | 'descobrir'>('amigos')
  const [comentandoPostId, setComentandoPostId] = useState<string | null>(null)
  const [criandoPost, setCriandoPost] = useState(searchParams.get('criar') === '1')
  const sessaoInicialId = searchParams.get('sessao')

  function fecharCriacao() {
    setCriandoPost(false)
    setSearchParams({}, { replace: true })
  }

  const feedAmigos = useFeedAmigos(aba === 'amigos' ? userId : undefined)
  const feedDescobrir = useFeedDescobrir(aba === 'descobrir' ? userId : undefined)
  const feed = aba === 'amigos' ? feedAmigos : feedDescobrir

  if (!sessao || !userId) {
    return (
      <div className="mx-auto max-w-[640px]">
        <Empty text="Carregando..." />
      </div>
    )
  }

  if (criandoPost) {
    return (
      <CriarPost
        userId={userId}
        sessaoInicialId={sessaoInicialId}
        onFechar={fecharCriacao}
        onPublicado={() => {
          fecharCriacao()
          setAba('amigos')
          feedAmigos.recarregar()
        }}
      />
    )
  }

  if (comentandoPostId) {
    return <ComentariosPost postId={comentandoPostId} meuId={userId} onFechar={() => setComentandoPostId(null)} />
  }

  return (
    <div className="animar-entrada mx-auto w-full max-w-[640px] pb-4">
      <header className="flex items-end justify-between border-b border-line/60 pb-4">
        <h1 className="text-[28px] font-semibold tracking-[-0.045em]">Social</h1>
        <button onClick={() => setCriandoPost(true)} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand">
          <Plus size={17} strokeWidth={1.8} /> Publicar
        </button>
      </header>
      <div className="flex items-center justify-between border-b border-line/60">
        <div className="flex">
          <button
            onClick={() => setAba('amigos')}
            className={`relative min-h-12 px-5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
              aba === 'amigos' ? 'text-ink after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-brand' : 'text-ink-3'
            }`}
          >
            Amigos
          </button>
          <button
            onClick={() => setAba('descobrir')}
            className={`relative min-h-12 px-5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
              aba === 'descobrir' ? 'text-ink after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-brand' : 'text-ink-3'
            }`}
          >
            Descobrir
          </button>
        </div>
      </div>

      {aba === 'amigos' && <CardDesafioInicial userId={userId} />}

      <div className="mt-2 pb-4">
        {feed.carregando && feed.posts.length === 0 ? (
          <Empty text="Carregando publicações..." />
        ) : feed.erro ? (
          <Empty text="Não deu pra carregar o feed agora." />
        ) : feed.posts.length === 0 ? (
          aba === 'amigos' ? (
            <div className="py-12 text-center"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">Ainda não há atividade</p><p className="mx-auto mt-2 max-w-xs text-sm text-ink-2">Siga pessoas para acompanhar os treinos delas.</p><button onClick={() => setAba('descobrir')} className="mt-5 min-h-11 text-xs font-semibold text-brand">Explorar</button></div>
          ) : (
            <Empty text="Nenhuma publicação por aqui ainda." />
          )
        ) : (
          feed.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              meuId={userId}
              onAbrirComentarios={setComentandoPostId}
              onAbrirAutor={(id) => navigate(id === userId ? '/perfil' : `/social/usuario/${id}`)}
              onRemovido={feed.recarregar}
            />
          ))
        )}
        {feed.temMais && (
          <button disabled={feed.carregando} onClick={feed.carregarMais} className="mt-4 min-h-11 w-full text-xs font-semibold text-brand disabled:opacity-50">{feed.carregando ? 'Carregando...' : 'Carregar mais'}</button>
        )}
      </div>
    </div>
  )
}
