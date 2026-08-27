import { useEffect, useRef, useState } from 'react'
import { Dumbbell, Send, Trash2 } from 'lucide-react'
import { useSessao } from '../lib/auth'
import { useHistoricoTreinos } from '../lib/historicoTreinos'
import { enviarMensagem, excluirMensagem, listarMensagens, marcarMensagensComoLidas, type Mensagem } from '../lib/social/mensagens'

type ChatProps = { conversaId?: string; grupoId?: string; mostrarAutores?: boolean }

export function Chat({ conversaId, grupoId, mostrarAutores = false }: ChatProps) {
  const { sessao } = useSessao()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [escolhendo, setEscolhendo] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)
  const historico = useHistoricoTreinos(sessao?.user.id, 10)
  const destino = { conversaId, grupoId }

  async function carregar() {
    try {
      setErro(null)
      setMensagens(await listarMensagens(destino))
      await marcarMensagensComoLidas(destino)
    } catch { setErro('Não foi possível carregar as mensagens.') }
  }

  useEffect(() => {
    let cancelado = false
    const atualizar = async () => {
      try {
        const dados = await listarMensagens({ conversaId, grupoId })
        if (!cancelado) {
          setMensagens(dados)
          await marcarMensagensComoLidas({ conversaId, grupoId })
        }
      } catch { if (!cancelado) setErro('Não foi possível carregar as mensagens.') }
    }
    void atualizar()
    const intervalo = window.setInterval(() => void atualizar(), 8000)
    return () => { cancelado = true; window.clearInterval(intervalo) }
  }, [conversaId, grupoId])

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensagens.length])

  async function enviar(treinoId?: string) {
    if (!texto.trim() && !treinoId) return
    setEnviando(true)
    try {
      await enviarMensagem(destino, texto, treinoId)
      setTexto(''); setEscolhendo(false)
      await carregar()
    } catch (e) {
      const detalhe = e instanceof Error ? e.message : ''
      setErro(detalhe.includes('enviar_mensagem') || detalhe.includes('schema cache') ? 'As mensagens ainda não foram ativadas no banco. Execute o arquivo 22_mensagens.sql no Supabase.' : 'Não foi possível enviar a mensagem.')
    } finally { setEnviando(false) }
  }

  async function excluir(id: number) {
    if (!window.confirm('Excluir esta mensagem?')) return
    try { await excluirMensagem(id); setMensagens((atuais) => atuais.filter((mensagem) => mensagem.id !== id)); setErro(null) }
    catch { setErro('Não foi possível excluir a mensagem.') }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto border-b border-line/60 py-4">
        {mensagens.length === 0 && !erro && <p className="py-12 text-center text-sm text-ink-2">Comece a conversa.</p>}
        {mensagens.map((mensagem) => {
          const minha = mensagem.remetenteId === sessao?.user.id
          return <div key={mensagem.id} className={`flex items-end gap-1 ${minha ? 'justify-end' : 'justify-start'}`}>
            {minha && <button onClick={() => void excluir(mensagem.id)} aria-label="Excluir mensagem" className="flex size-10 shrink-0 items-center justify-center text-white/40 hover:text-down"><Trash2 size={15} /></button>}
            {mostrarAutores && !minha && <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-card">{mensagem.fotoUrl ? <img src={mensagem.fotoUrl} alt="" className="size-full object-cover" /> : mensagem.nome[0]}</div>}
            <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${minha ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-card text-ink'}`}>
              {mostrarAutores && !minha && <p className="mb-1 text-xs font-semibold text-brand">{mensagem.nome}</p>}
              {mensagem.texto && <p className="whitespace-pre-wrap break-words text-sm leading-5">{mensagem.texto}</p>}
              {mensagem.treinoId && <div className="mt-2 flex items-center gap-2 border-t border-white/20 pt-2 text-xs font-semibold"><Dumbbell size={15} /> Treino marcado</div>}
              <p className={`mt-1 text-right text-[10px] ${minha ? 'text-white/60' : 'text-ink-3'}`}>{new Date(mensagem.criadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        })}
        <div ref={fimRef} />
      </div>
      {erro && <p className="mt-2 text-sm text-down">{erro}</p>}
      {escolhendo && <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-line bg-card p-2">{historico.carregando ? <p className="p-3 text-xs text-ink-2">Carregando treinos...</p> : historico.treinos.map((treino) => <button key={treino.id} onClick={() => void enviar(treino.id)} className="min-h-12 w-full border-b border-line/60 px-2 text-left text-sm">{treino.nome}</button>)}</div>}
      <div className="mt-auto flex shrink-0 items-end gap-2 bg-app py-2">
        <button onClick={() => setEscolhendo((valor) => !valor)} aria-label="Marcar treino" className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-card text-brand"><Dumbbell size={18} /></button>
        <textarea value={texto} maxLength={1000} onChange={(e) => setTexto(e.target.value)} rows={1} placeholder="Mensagem" className="min-h-12 flex-1 resize-none rounded-3xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-brand" />
        <button disabled={enviando} onClick={() => void enviar()} aria-label="Enviar mensagem" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"><Send size={18} /></button>
      </div>
    </section>
  )
}
