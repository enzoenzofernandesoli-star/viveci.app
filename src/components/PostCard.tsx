import { useState } from 'react'
import { Heart, MessageCircle, Dumbbell } from 'lucide-react'
import type { Post } from '../lib/social/posts'
import { curtir, descurtir } from '../lib/social/posts'
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
}: {
  post: Post
  meuId: string
  onAbrirComentarios: (postId: string) => void
  onAbrirAutor: (autorId: string) => void
}) {
  const [curtido, setCurtido] = useState(post.curtiPorMim)
  const [contagem, setContagem] = useState(post.contagemCurtidas)
  const [enviando, setEnviando] = useState(false)

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
    <div className="animar-entrada overflow-hidden rounded-2xl border border-line bg-card">
      <button onClick={() => onAbrirAutor(post.autor.id)} className="flex items-center gap-3 p-4 text-left">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-card-hover">
          {post.autor.fotoUrl && <img src={post.autor.fotoUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{post.autor.nome}</p>
          <p className="text-xs text-ink-2">{formatoData(post.criadoEm)}</p>
        </div>
      </button>

      {post.fotoUrl && (
        <EditorialMedia
          src={post.fotoUrl}
          alt={`Publicação de ${post.autor.nome}`}
          className="max-h-[420px] w-full"
        />
      )}

      <div className="p-4">
        {post.legenda && <p className="text-sm text-ink">{post.legenda}</p>}

        {post.resumoTreino && (
          <div className="mt-3 rounded-xl border border-line bg-card-hover p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand">
              <Dumbbell size={14} strokeWidth={1.75} />
              {post.resumoTreino.nome}
            </div>
            <div className="mt-2 flex gap-4 text-sm text-ink-2">
              {post.mostrarDuracao && post.resumoTreino.duracaoSeg !== null && (
                <span>{formatoDuracao(post.resumoTreino.duracaoSeg)}</span>
              )}
              {post.mostrarSeries && <span>{post.resumoTreino.numeroSeries} séries</span>}
              {post.mostrarVolume && post.resumoTreino.volumeTotalKg !== null && (
                <span className="num">{formatoBR(post.resumoTreino.volumeTotalKg)} kg</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-5">
          <button onClick={alternarCurtida} className="flex items-center gap-1.5 text-sm text-ink-2">
            <Heart size={19} strokeWidth={1.75} className={curtido ? 'fill-brand text-brand' : ''} />
            <span className="num">{contagem}</span>
          </button>
          <button onClick={() => onAbrirComentarios(post.id)} className="flex items-center gap-1.5 text-sm text-ink-2">
            <MessageCircle size={19} strokeWidth={1.75} />
            <span className="num">{post.contagemComentarios}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
