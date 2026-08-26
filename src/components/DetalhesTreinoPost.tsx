import { useState } from 'react'
import { Copy, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Post } from '../lib/social/posts.ts'
import { copiarTreinoDoPost } from '../lib/social/posts.ts'
import { mensagemErro } from '../lib/mensagemErro.ts'
import { Modal } from './Modal.tsx'

export function DetalhesTreinoPost({ post, fechar }: { post: Post; fechar: () => void }) {
  const navigate = useNavigate()
  const [copiando, setCopiando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function copiar() {
    if (copiando) return
    setCopiando(true)
    setErro(null)
    try {
      const rotinaId = await copiarTreinoDoPost(post.id)
      fechar()
      navigate(`/treino/${rotinaId}/editar`)
    } catch (falha) {
      setErro(mensagemErro(falha, 'Não deu pra copiar esse treino agora.'))
    } finally {
      setCopiando(false)
    }
  }

  return <Modal fechar={fechar} rotulo="Detalhes do treino compartilhado">
    <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand">Treino de {post.autor.nome}</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-ink">{post.resumoTreino?.nome}</h2></div>
        <button onClick={fechar} aria-label="Fechar" className="flex size-11 items-center justify-center text-ink-2"><X size={18} /></button>
      </div>
      <div className="mt-5 divide-y divide-line/60 border-y border-line/60">
        {post.exercicios.map((exercicio) => <div key={exercicio.exercicioId} className="py-4">
          <p className="text-sm font-semibold text-ink">{exercicio.nome}</p>
          <p className="mt-1 text-xs text-ink-2">{exercicio.series} séries · {exercicio.repsMin === exercicio.repsMax ? exercicio.repsMin : `${exercicio.repsMin}–${exercicio.repsMax}`} repetições · {exercicio.descansoSeg}s descanso</p>
        </div>)}
      </div>
      {erro && <p className="mt-4 text-sm text-down">{erro}</p>}
      <button onClick={copiar} disabled={copiando} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white disabled:opacity-60"><Copy size={17} />{copiando ? 'Copiando...' : 'Copiar para meus treinos'}</button>
      <p className="mt-3 text-center text-xs text-ink-3">Uma nova rotina será criada para você editar.</p>
    </div>
  </Modal>
}
