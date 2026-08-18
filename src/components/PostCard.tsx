import { useState } from 'react'
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react'
import type { Post } from '../lib/social/posts'
import { curtir, descurtir, excluirPost } from '../lib/social/posts'
import { bloquearUsuario, denunciarPost } from '../lib/social/moderacao'
import { EditorialMedia } from './ui/EditorialMedia'

function formatoBR(n: number): string {
  return Math.round(n).toLocaleString('pt-BR')
}

function formatoDuracao(seg: number): string {
  const m = Math.round(seg / 60)
  return `${m} min`
}

function formatoData(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffH < 1) return 'agora'
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d`
}

export function PostCard({
  post,
  meuId,
  onAbrirComentarios,
  onAbrirAutor,
  onRemovido,
}: {
  post: Post
  meuId: string
  onAbrirComentarios: (postId: string) => void
  onAbrirAutor: (autorId: string) => void
  onRemovido?: () => void
}) {
  const [curtido, setCurtido] = useState(post.curtiPorMim)
  const [contagem, setContagem] = useState(post.contagemCurtidas)
  const [enviando, setEnviando] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function alternarCurtida() {
    if (enviando) return
    setEnviando(true)
    const novoCurtido = !curtido
    setCurtido(novoCurtido)
    setContagem((c) => c + (novoCurtido ? 1 : -1))
    try {
      if (novoCurtido) await curtir(post.id, meuId)
      else await descurtir(post.id, meuId)
    } catch {
      setCurtido(!novoCurtido)
      setContagem((c) => c + (novoCurtido ? -1 : 1))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <article className="animar-entrada border-b border-line/60 py-6 first:pt-4">
      <div className="flex items-center gap-2"><button onClick={() => onAbrirAutor(post.autor.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-card-hover">
          {post.autor.fotoUrl && <img src={post.autor.fotoUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{post.autor.nome}</p>
          <p className="mt-0.5 truncate text-xs text-ink-2">{post.resumoTreino ? `${post.resumoTreino.nome} · ` : ''}{formatoData(post.criadoEm)}</p>
        </div>
      </button><button onClick={() => setMenuAberto((v) => !v)} aria-label="Ações da publicação" className="flex size-11 items-center justify-center text-ink-3"><MoreHorizontal size={19} /></button></div>

      {menuAberto && <div className="mt-2 flex gap-4 border-y border-line/60 py-2 text-xs font-semibold">
        {post.autor.id === meuId ? <button onClick={async () => { await excluirPost(post.id); onRemovido?.() }} className="min-h-11 text-down">Excluir publicação</button> : <><button onClick={async () => { await denunciarPost(meuId, post.id); setMensagem('Denúncia registrada.'); setMenuAberto(false) }} className="min-h-11 text-ink-2">Denunciar</button><button onClick={async () => { await bloquearUsuario(meuId, post.autor.id); setMensagem('Usuário bloqueado.'); setMenuAberto(false); onRemovido?.() }} className="min-h-11 text-ink-2">Bloquear</button></>}
      </div>}
      {mensagem && <p className="mt-2 text-xs text-ink-2">{mensagem}</p>}

      {post.fotoUrl && (
        <EditorialMedia
          src={post.fotoUrl}
          alt={`Publicação de ${post.autor.nome}`}
          className="mt-4 aspect-[4/5] max-h-[620px] w-full rounded-2xl"
        />
      )}

      <div className="pt-4">
        {post.legenda && <p className="line-clamp-3 text-sm leading-relaxed text-ink">{post.legenda}</p>}

        {post.resumoTreino && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-x-2 text-xs text-ink-2">
              {post.mostrarDuracao && post.resumoTreino.duracaoSeg !== null && (
                <span>{formatoDuracao(post.resumoTreino.duracaoSeg)} ·</span>
              )}
              {post.mostrarSeries && <span>{post.resumoTreino.numeroSeries} séries ·</span>}
              {post.mostrarVolume && post.resumoTreino.volumeTotalKg !== null && (
                <span className="num">{formatoBR(post.resumoTreino.volumeTotalKg)} kg</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-6">
          <button onClick={alternarCurtida} className="flex items-center gap-1.5 text-sm text-ink-2">
            <Heart size={19} strokeWidth={1.75} className={curtido ? 'fill-brand text-brand' : ''} />
            <span className="num">{contagem}</span>
          </button>
          <button onClick={() => onAbrirComentarios(post.id)} className="flex items-center gap-1.5 text-xs text-ink-2">
            <MessageCircle size={19} strokeWidth={1.75} />
            <span className="num">{post.contagemComentarios} comentários</span>
          </button>
        </div>
      </div>
    </article>
  )
}
