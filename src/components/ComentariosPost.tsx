import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Empty } from './Empty'
import { useComentarios, comentar } from '../lib/social/posts'

function formatoData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function ComentariosPost({ postId, meuId, onFechar }: { postId: string; meuId: string; onFechar: () => void }) {
  const { comentarios, carregando, erro, recarregar } = useComentarios(postId)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    const limpo = texto.trim()
    if (limpo.length === 0) return
    setEnviando(true)
    try {
      await comentar(postId, meuId, limpo)
      setTexto('')
      recarregar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="animar-entrada mx-auto max-w-[640px] pb-24 lg:pb-4">
      <div className="flex min-h-14 items-center gap-3 border-b border-line/60">
        <button onClick={onFechar} aria-label="Voltar" className="flex size-11 items-center justify-center text-ink-2 hover:text-ink">
          <ChevronLeft size={22} strokeWidth={1.75} />
        </button>
        <h1 className="text-lg font-semibold">Comentários</h1>
      </div>

      <div className="mt-2 divide-y divide-line/60">
        {carregando ? (
          <Empty text="Carregando comentários..." />
        ) : erro ? (
          <Empty text="Não deu pra carregar os comentários." />
        ) : comentarios.length === 0 ? (
          <Empty text="Nenhum comentário ainda. Seja o primeiro." />
        ) : (
          comentarios.map((c) => (
            <div key={c.id} className="flex gap-3 py-4">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-card-hover">
                {c.autor.fotoUrl && <img src={c.autor.fotoUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{c.autor.nome}</p>
                  <p className="text-[10px] text-ink-3">{formatoData(c.criadoEm)}</p>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{c.texto}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 flex gap-2 border-t border-line bg-app p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:static lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Adicione um comentário..."
          className="h-11 flex-1 rounded-xl border border-line bg-card-hover px-3 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
        />
        <button
          onClick={enviar}
          disabled={enviando || texto.trim().length === 0}
          className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
