import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Chat } from '../components/Chat'
import { useSessao } from '../lib/auth'
import { carregarPessoaConversa, type PessoaConversa } from '../lib/social/mensagens'

export default function Conversa() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sessao } = useSessao()
  const [pessoa, setPessoa] = useState<PessoaConversa | null>(null)

  useEffect(() => {
    if (id && sessao?.user.id) carregarPessoaConversa(id, sessao.user.id).then(setPessoa).catch(() => setPessoa(null))
  }, [id, sessao?.user.id])

  if (!id) return null
  return (
    <div className="mx-auto flex h-[calc(100dvh-9.5rem-env(safe-area-inset-bottom))] max-w-[640px] flex-col">
      <header className="sticky top-0 z-10 flex min-h-16 shrink-0 items-center gap-3 border-b border-line bg-app">
        <button onClick={() => navigate('/social')} className="flex size-11 items-center justify-center" aria-label="Voltar"><ArrowLeft size={19} /></button>
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-line bg-card">{pessoa?.fotoUrl ? <img src={pessoa.fotoUrl} alt="" className="size-full object-cover" /> : pessoa?.nome?.[0] ?? '?'}</div>
        <div><h1 className="text-base font-semibold">{pessoa?.nome ?? 'Conversa'}</h1><p className="text-[11px] text-ink-2">VIVECI</p></div>
      </header>
      <Chat conversaId={id} />
    </div>
  )
}
