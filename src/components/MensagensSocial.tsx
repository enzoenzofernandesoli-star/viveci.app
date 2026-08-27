import { useEffect, useState } from 'react'
import { MessageCircle, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSessao } from '../lib/auth'
import { abrirConversa, listarConversas, type Conversa } from '../lib/social/mensagens'
import { usePesquisaPessoas } from '../lib/social/pesquisaPessoas'

export function MensagensSocial() {
  const { sessao } = useSessao()
  const navigate = useNavigate()
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const pesquisa = usePesquisaPessoas(busca, true)

  useEffect(() => {
    if (sessao?.user.id) listarConversas(sessao.user.id).then(setConversas).catch(() => setErro('Não foi possível carregar suas mensagens.'))
  }, [sessao?.user.id])

  async function abrir(id: string) {
    try { const conversa = await abrirConversa(id); navigate(`/social/mensagem/${conversa}`) }
    catch { setErro('Não foi possível abrir a conversa.') }
  }

  return <section className="py-5">
    <label className="campo-pesquisa flex items-center rounded-xl border border-line bg-card px-3"><Search size={17} className="text-ink-3" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar pessoa para conversar" className="h-12 flex-1 bg-transparent px-2 text-sm outline-none" /></label>
    {erro && <p className="mt-3 text-sm text-down">{erro}</p>}
    <div className="mt-4 divide-y divide-line/60">{busca.trim().length >= 2 ? pesquisa.pessoas.filter((pessoa) => pessoa.id !== sessao?.user.id).map((pessoa) => <Pessoa key={pessoa.id} nome={pessoa.nome ?? 'Atleta VIVECI'} foto={pessoa.foto_url} onClick={() => void abrir(pessoa.id)} />) : conversas.map((conversa) => <Pessoa key={conversa.id} nome={conversa.nome} foto={conversa.fotoUrl} naoLidas={conversa.naoLidas} onClick={() => navigate(`/social/mensagem/${conversa.id}`)} />)}</div>
    {!busca && conversas.length === 0 && !erro && <div className="py-12 text-center"><MessageCircle className="mx-auto text-ink-3" /><p className="mt-3 text-sm text-ink-2">Pesquise uma pessoa para começar.</p></div>}
  </section>
}

function Pessoa({ nome, foto, naoLidas = 0, onClick }: { nome: string; foto: string | null; naoLidas?: number; onClick: () => void }) {
  return <button onClick={onClick} className="flex min-h-16 w-full items-center gap-3 text-left"><div className="flex size-11 items-center justify-center overflow-hidden rounded-full border border-line bg-card">{foto ? <img src={foto} alt="" className="size-full object-cover" /> : nome[0]}</div><p className={`flex-1 text-sm ${naoLidas > 0 ? 'font-bold text-ink' : 'font-semibold'}`}>{nome}</p>{naoLidas > 0 ? <span aria-label={`${naoLidas} mensagens não lidas`} className="flex min-w-6 items-center justify-center rounded-full bg-brand px-1.5 py-1 text-[10px] font-bold text-white">{naoLidas > 99 ? '99+' : naoLidas}</span> : <MessageCircle size={17} className="text-brand" />}</button>
}
