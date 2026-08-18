import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Page } from '../components/Page'
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
  const userId = sessao?.user.id
  const [aba, setAba] = useState<'amigos' | 'descobrir'>('amigos')
  const [comentandoPostId, setComentandoPostId] = useState<string | null>(null)
  const [criandoPost, setCriandoPost] = useState(false)

  const feedAmigos = useFeedAmigos(userId)
  const feedDescobrir = useFeedDescobrir(userId)
  const feed = aba === 'amigos' ? feedAmigos : feedDescobrir

  if (!sessao || !userId) {
    return (
      <Page title="Social">
        <Empty text="Carregando..." />
      </Page>
    )
  }

  if (criandoPost) {
    return (
      <CriarPost
        userId={userId}
        onFechar={() => setCriandoPost(false)}
        onPublicado={() => {
          setCriandoPost(false)
          feedAmigos.recarregar()
        }}
      />
    )
  }

  if (comentandoPostId) {
    return <ComentariosPost postId={comentandoPostId} meuId={userId} onFechar={() => setComentandoPostId(null)} />
  }

  return (
    <Page title="Social">
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setAba('amigos')}
            className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
              aba === 'amigos' ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
            }`}
          >
            Amigos
          </button>
          <button
            onClick={() => setAba('descobrir')}
            className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
              aba === 'descobrir' ? 'bg-brand/15 text-brand' : 'border border-line text-ink-2'
            }`}
          >
            Descobrir
          </button>
        </div>
        <button
          onClick={() => setCriandoPost(true)}
          aria-label="Nova publicação"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover"
        >
          <Plus size={20} strokeWidth={2} />
        </button>
      </div>

      {aba === 'amigos' && <CardDesafioInicial userId={userId} />}

      <div className="mt-5 space-y-4 pb-4">
        {feed.carregando ? (
          <Empty text="Carregando publicações..." />
        ) : feed.erro ? (
          <Empty text="Não deu pra carregar o feed agora." />
        ) : feed.posts.length === 0 ? (
          aba === 'amigos' ? (
            <Empty text="Seu feed está vazio. Siga pessoas na aba Descobrir ou publique seu primeiro treino." />
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
            />
          ))
        )}
      </div>
    </Page>
  )
}
