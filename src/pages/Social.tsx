import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import { Empty } from '../components/Empty'
import { PostCard } from '../components/PostCard'
import { ComentariosPost } from '../components/ComentariosPost'
import { CriarPost } from '../components/CriarPost'
import { CardDesafioInicial } from '../components/CardDesafioInicial'
import { GruposSocial } from '../components/GruposSocial'
import { MensagensSocial } from '../components/MensagensSocial'
import { useSessao } from '../lib/auth'
import { useFeedAmigos, useFeedDescobrir } from '../lib/social/posts'
import { useEhHost } from '../lib/social/host'
import { usePesquisaPessoas } from '../lib/social/pesquisaPessoas'
import { listarMensagensNaoLidas } from '../lib/social/mensagens'

export default function Social() {
  const { sessao } = useSessao()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const userId = sessao?.user.id
  const { ehHost } = useEhHost(userId)
  const [aba, setAba] = useState<'amigos' | 'descobrir' | 'grupos' | 'mensagens'>('amigos')
  const [comentandoPostId, setComentandoPostId] = useState<string | null>(null)
  const [criandoPost, setCriandoPost] = useState(searchParams.get('criar') === '1')
  const [pesquisando, setPesquisando] = useState(false)
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [naoLidas, setNaoLidas] = useState({ mensagens: 0, grupos: 0 })
  const sessaoInicialId = searchParams.get('sessao')
  const pesquisa = usePesquisaPessoas(termoPesquisa, pesquisando)

  useEffect(() => {
    if (!userId) return
    let cancelado = false
    const atualizar = async () => {
      try {
        const contagens = await listarMensagensNaoLidas()
        if (!cancelado) setNaoLidas({
          mensagens: [...contagens.conversas.values()].reduce((soma, valor) => soma + valor, 0),
          grupos: [...contagens.grupos.values()].reduce((soma, valor) => soma + valor, 0),
        })
      } catch { if (!cancelado) setNaoLidas({ mensagens: 0, grupos: 0 }) }
    }
    void atualizar()
    const intervalo = window.setInterval(() => void atualizar(), 8000)
    return () => { cancelado = true; window.clearInterval(intervalo) }
  }, [userId, aba])

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
        <div className="flex items-center gap-1">
          <button onClick={() => setPesquisando(true)} aria-label="Pesquisar pessoas" className="flex size-11 items-center justify-center text-ink-2 transition-colors hover:text-ink">
            <Search size={19} strokeWidth={1.75} />
          </button>
          <button onClick={() => setCriandoPost(true)} className="inline-flex min-h-11 items-center gap-2 px-2 text-xs font-semibold text-brand">
            <Plus size={17} strokeWidth={1.8} /> Publicar
          </button>
        </div>
      </header>

      {pesquisando && (
        <section className="border-b border-line/60 py-4" aria-label="Pesquisa de pessoas">
          <div className="campo-pesquisa flex items-center gap-2 rounded-xl border border-line bg-card px-3 focus-within:border-brand">
            <Search size={17} strokeWidth={1.75} className="shrink-0 text-ink-3" />
            <input
              autoFocus
              value={termoPesquisa}
              onChange={(evento) => setTermoPesquisa(evento.target.value)}
              maxLength={60}
              placeholder="Pesquisar pelo nome"
              aria-label="Nome da pessoa"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
            />
            <button
              onClick={() => { setPesquisando(false); setTermoPesquisa('') }}
              aria-label="Fechar pesquisa"
              className="flex size-11 shrink-0 items-center justify-center text-ink-2"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {termoPesquisa.trim().length < 2 ? (
            <p className="px-1 pt-3 text-xs text-ink-2">Digite pelo menos 2 letras.</p>
          ) : pesquisa.carregando ? (
            <p className="px-1 pt-3 text-xs text-ink-2" role="status">Pesquisando pessoas...</p>
          ) : pesquisa.erro ? (
            <p className="px-1 pt-3 text-xs text-down">{pesquisa.erro}</p>
          ) : pesquisa.pessoas.length === 0 ? (
            <p className="px-1 pt-3 text-xs text-ink-2">Nenhuma pessoa encontrada.</p>
          ) : (
            <div className="mt-3 divide-y divide-line/60 border-y border-line/60">
              {pesquisa.pessoas.map((pessoa) => (
                <button
                  key={pessoa.id}
                  onClick={() => navigate(pessoa.id === userId ? '/perfil' : `/social/usuario/${pessoa.id}`)}
                  className="flex min-h-16 w-full items-center gap-3 py-2 text-left"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-card-hover">
                    {pessoa.foto_url ? <img src={pessoa.foto_url} alt="" className="h-full w-full object-cover" /> : <span className="text-sm font-semibold text-ink-3">{pessoa.nome?.[0]?.toUpperCase() ?? '?'}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{pessoa.nome ?? 'Atleta VIVECI'}</p>
                    {pessoa.bio && <p className="mt-0.5 truncate text-xs text-ink-2">{pessoa.bio}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      <nav className="abas-social overflow-x-auto border-b border-line/60 pb-1" aria-label="Seções do Social">
        <div className="flex min-w-max">
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
          <button onClick={() => setAba('mensagens')} className={`relative flex min-h-12 items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-[0.04em] ${aba === 'mensagens' ? 'text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-brand' : 'text-ink-3'}`}>Mensagens{naoLidas.mensagens > 0 && <span aria-label={`${naoLidas.mensagens} mensagens não lidas`} className="flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold tracking-normal text-white">{naoLidas.mensagens > 99 ? '99+' : naoLidas.mensagens}</span>}</button>
          <button
            onClick={() => setAba('grupos')}
            className={`relative min-h-12 px-4 text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${
              aba === 'grupos' ? 'text-ink after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-brand' : 'text-ink-3'
            }`}
          >
            <span className="flex items-center gap-1.5">Grupos{naoLidas.grupos > 0 && <span aria-label={`${naoLidas.grupos} mensagens de grupos não lidas`} className="flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold tracking-normal text-white">{naoLidas.grupos > 99 ? '99+' : naoLidas.grupos}</span>}</span>
          </button>
        </div>
      </nav>

      {aba === 'amigos' && <CardDesafioInicial userId={userId} />}

      {aba === 'grupos' && <GruposSocial />}
      {aba === 'mensagens' && <MensagensSocial />}

      {aba !== 'grupos' && aba !== 'mensagens' && <div className="mt-2 pb-4">
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
              ehHost={ehHost}
            />
          ))
        )}
        {feed.temMais && (
          <button disabled={feed.carregando} onClick={feed.carregarMais} className="mt-4 min-h-11 w-full text-xs font-semibold text-brand disabled:opacity-50">{feed.carregando ? 'Carregando...' : 'Carregar mais'}</button>
        )}
      </div>}
    </div>
  )
}
