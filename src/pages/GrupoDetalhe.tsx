import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Camera, Crown, Lock, Search, Shield, UserMinus, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { BrasaoRank } from '../components/RankCorporal'
import { Empty } from '../components/Empty'
import { Chat } from '../components/Chat'
import { calcularRankPorMedia } from '../lib/rankCorporal'
import { alterarPapelMembro, atualizarFotoGrupo, atualizarGrupo, carregarGrupo, carregarMembrosGrupo, convidarParaGrupo, entrarNoGrupo, removerMembroGrupo, type GrupoSocial, type MembroGrupo, type VisibilidadeGrupo } from '../lib/social/grupos'
import { usePesquisaPessoas } from '../lib/social/pesquisaPessoas'

export default function GrupoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [grupo, setGrupo] = useState<GrupoSocial | null>(null)
  const [membros, setMembros] = useState<MembroGrupo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [senha, setSenha] = useState('')
  const [editando, setEditando] = useState(false)
  const [convidando, setConvidando] = useState(false)
  const [versao, setVersao] = useState(0)
  const [atualizandoFoto, setAtualizandoFoto] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelado = false
    setCarregando(true); setErro(null)
    carregarGrupo(id).then(async (g) => ({ g, m: g.souMembro ? await carregarMembrosGrupo(id) : [] }))
      .then(({ g, m }) => { if (!cancelado) { setGrupo(g); setMembros(m) } })
      .catch(() => { if (!cancelado) setErro('Não foi possível carregar este grupo.') })
      .finally(() => { if (!cancelado) setCarregando(false) })
    return () => { cancelado = true }
  }, [id, versao])

  const mediaGrupo = useMemo(() => membros.length ? Math.round(membros.reduce((s, m) => s + m.mediaSemanal, 0) / membros.length) : 0, [membros])
  const rank = calcularRankPorMedia(mediaGrupo)

  if (carregando) return <Empty text="Carregando grupo..." />
  if (!grupo || !id) return <Empty text={erro ?? 'Grupo não encontrado.'} />
  const gerencia = grupo.meuPapel === 'dono' || grupo.meuPapel === 'admin'

  async function trocarFoto(foto?: File) {
    if (!foto || !id) return
    setAtualizandoFoto(true); setErro(null)
    try {
      await atualizarFotoGrupo(id, foto)
      setVersao((v) => v + 1)
    } catch {
      setErro('Não foi possível atualizar a foto do grupo. Tente novamente.')
    } finally {
      setAtualizandoFoto(false)
    }
  }

  if (editando) return <EditarGrupo grupo={grupo} fechar={() => setEditando(false)} salvo={() => { setEditando(false); setVersao((v) => v + 1) }} />
  if (convidando) return <ConvidarGrupo grupoId={id} fechar={() => setConvidando(false)} />

  return (
    <div className="animar-entrada mx-auto w-full max-w-[640px] pb-8">
      <header className="flex min-h-12 items-center gap-2 border-b border-line/60 pb-3"><button onClick={() => navigate('/social')} aria-label="Voltar" className="flex size-11 items-center justify-center text-ink-2"><ArrowLeft size={20} /></button><p className="text-sm font-semibold">Grupo VIVECI</p></header>
      <section className="py-6 text-center">
        <div className="relative mx-auto size-24">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-[24px] border border-line bg-card">{grupo.fotoUrl ? <img src={grupo.fotoUrl} alt={`Foto do grupo ${grupo.nome}`} className="size-full object-cover" /> : <Users size={34} className="text-ink-3" />}</div>
          {gerencia && <label aria-label="Alterar foto do grupo" className={`absolute -bottom-2 -right-2 flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-brand ${atualizandoFoto ? 'pointer-events-none opacity-50' : ''}`}><Camera size={18} /><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={atualizandoFoto} onChange={(e) => { void trocarFoto(e.target.files?.[0]); e.target.value = '' }} /></label>}
        </div>
        {atualizandoFoto && <p className="mt-3 text-xs text-ink-2">Atualizando foto...</p>}
        {erro && grupo.souMembro && <p className="mt-3 text-sm text-down">{erro}</p>}
        <div className="mt-4 flex items-center justify-center gap-2"><h1 className="text-2xl font-semibold tracking-[-0.04em]">{grupo.nome}</h1>{grupo.visibilidade === 'privado' && <Lock size={15} className="text-ink-3" />}</div>
        {grupo.descricao && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-2">{grupo.descricao}</p>}
        <p className="mt-2 text-xs text-ink-3">{grupo.totalMembros} {grupo.totalMembros === 1 ? 'membro' : 'membros'} · Grupo {grupo.visibilidade}</p>
      </section>

      {!grupo.souMembro ? (
        <section className="border-y border-line/60 py-6">
          <p className="text-sm font-semibold">Entre para acompanhar o rank coletivo</p>
          {grupo.visibilidade === 'privado' && <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Senha do grupo" className="mt-4 h-12 w-full rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-brand" />}
          {erro && <p className="mt-3 text-sm text-down">{erro}</p>}
          <button onClick={async () => { try { await entrarNoGrupo(id, senha); setVersao((v) => v + 1) } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível entrar.') } }} className="mt-4 min-h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white">{grupo.visibilidade === 'privado' ? 'Entrar com senha ou convite' : 'Entrar no grupo'}</button>
        </section>
      ) : (
        <>
          <section className="flex items-center gap-5 border-y border-line/60 py-6"><BrasaoRank rank={rank} tamanho={100} /><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Rank coletivo semanal</p><h2 className="mt-2 text-2xl font-semibold" style={{ color: rank.cor }}>{rank.nome}</h2><p className="mt-1 text-xs text-ink-2">Média do grupo: {rank.mediaSemanal}%</p><div className="mt-4 h-1.5 overflow-hidden bg-line"><div className="h-full" style={{ width: `${rank.progressoNoRank}%`, backgroundColor: rank.cor }} /></div><p className="mt-2 text-[11px] text-ink-3">{rank.proximoRank ? `Faltam ${rank.pontosParaProximo} pontos para ${rank.proximoRank}.` : 'Rank máximo alcançado.'}</p></div></section>
          {gerencia && <div className="grid grid-cols-2 gap-2 border-b border-line/60 py-4"><button onClick={() => setEditando(true)} className="min-h-11 rounded-xl border border-line text-xs font-semibold text-ink-2">Editar grupo</button><button onClick={() => setConvidando(true)} className="min-h-11 rounded-xl border border-line text-xs font-semibold text-brand">Convidar pessoa</button></div>}
          <section className="mt-7"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Integrantes e contribuição</p>{erro && <p className="mt-3 text-sm text-down">{erro}</p>}<div className="mt-3 divide-y divide-line/60 border-y border-line/60">{membros.map((m) => <Membro key={m.userId} membro={m} meuPapel={grupo.meuPapel} grupoId={id} atualizado={() => setVersao((v) => v + 1)} onErro={setErro} />)}</div></section>
          <section className="mt-8"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">Conversa do grupo</p><Chat grupoId={id} mostrarAutores /></section>
        </>
      )}
    </div>
  )
}

function Membro({ membro, meuPapel, grupoId, atualizado, onErro }: { membro: MembroGrupo; meuPapel: GrupoSocial['meuPapel']; grupoId: string; atualizado: () => void; onErro: (erro: string | null) => void }) {
  const [processando, setProcessando] = useState(false)
  const possoGerenciar = (meuPapel === 'dono' && membro.papel !== 'dono') || (meuPapel === 'admin' && membro.papel === 'membro')
  async function executar(acao: () => Promise<void>) {
    setProcessando(true); onErro(null)
    try { await acao(); atualizado() } catch { onErro('Não foi possível alterar este integrante.') } finally { setProcessando(false) }
  }
  return <div className="flex min-h-16 items-center gap-3 py-3"><div className="flex size-11 items-center justify-center overflow-hidden rounded-full border border-line bg-card">{membro.fotoUrl ? <img src={membro.fotoUrl} alt="" className="size-full object-cover" /> : <span>{membro.nome[0]}</span>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{membro.nome}</p><p className="mt-0.5 text-xs text-ink-2">{membro.papel === 'dono' ? 'Dono' : membro.papel === 'admin' ? 'Administrador' : 'Membro'} · {membro.mediaSemanal}%</p></div>{membro.papel === 'dono' ? <Crown size={17} className="text-gold" /> : possoGerenciar && <div className="flex"><button disabled={processando} onClick={() => executar(() => alterarPapelMembro(grupoId, membro.userId, membro.papel === 'admin' ? 'membro' : 'admin'))} aria-label="Alterar administrador" className="flex size-11 items-center justify-center text-ink-2 disabled:opacity-40"><Shield size={17} /></button><button disabled={processando} onClick={() => executar(() => removerMembroGrupo(grupoId, membro.userId))} aria-label="Remover membro" className="flex size-11 items-center justify-center text-down disabled:opacity-40"><UserMinus size={17} /></button></div>}</div>
}

function EditarGrupo({ grupo, fechar, salvo }: { grupo: GrupoSocial; fechar: () => void; salvo: () => void }) {
  const [nome,setNome]=useState(grupo.nome), [descricao,setDescricao]=useState(grupo.descricao??''), [visibilidade,setVisibilidade]=useState<VisibilidadeGrupo>(grupo.visibilidade), [senha,setSenha]=useState(''), [erro,setErro]=useState<string|null>(null)
  return <div className="mx-auto max-w-[640px] py-5"><button onClick={fechar} className="min-h-11 text-sm text-ink-2">← Voltar</button><h1 className="mt-3 text-2xl font-semibold">Editar grupo</h1><label className="mt-6 flex min-h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink-2"><Camera size={18} className="mr-2"/>Alterar foto<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async(e)=>{const f=e.target.files?.[0];if(f)try{await atualizarFotoGrupo(grupo.id,f);salvo()}catch{setErro('Não foi possível atualizar a foto.')}}}/></label><input value={nome} onChange={(e)=>setNome(e.target.value)} className="mt-4 h-12 w-full rounded-xl border border-line bg-card px-3"/><textarea value={descricao} onChange={(e)=>setDescricao(e.target.value)} rows={3} className="mt-3 w-full rounded-xl border border-line bg-card p-3"/><div className="mt-3 grid grid-cols-2 gap-2">{(['aberto','privado'] as const).map(v=><button key={v} onClick={()=>setVisibilidade(v)} className={`min-h-12 rounded-xl border capitalize ${visibilidade===v?'border-brand text-brand':'border-line text-ink-2'}`}>{v}</button>)}</div>{visibilidade==='privado'&&<input type="password" value={senha} onChange={(e)=>setSenha(e.target.value)} placeholder="Nova senha (opcional)" className="mt-3 h-12 w-full rounded-xl border border-line bg-card px-3"/>}{erro&&<p className="mt-3 text-sm text-down">{erro}</p>}<button onClick={async()=>{try{await atualizarGrupo(grupo.id,{nome,descricao,visibilidade,senha});salvo()}catch(e){setErro(e instanceof Error?e.message:'Não foi possível salvar.')}}} className="mt-5 min-h-12 w-full rounded-xl bg-brand font-semibold text-white">Salvar alterações</button></div>
}

function ConvidarGrupo({ grupoId, fechar }: { grupoId: string; fechar: () => void }) {
  const [busca,setBusca]=useState(''), [mensagem,setMensagem]=useState<string|null>(null)
  const pesquisa=usePesquisaPessoas(busca,true)
  return <div className="mx-auto max-w-[640px] py-5"><button onClick={fechar} className="min-h-11 text-sm text-ink-2">← Voltar</button><h1 className="mt-3 text-2xl font-semibold">Convidar pessoa</h1><label className="mt-5 flex items-center rounded-xl border border-line bg-card px-3"><Search size={17} className="text-ink-3"/><input value={busca} onChange={(e)=>setBusca(e.target.value)} placeholder="Pesquisar pelo nome" className="h-12 flex-1 bg-transparent px-2 text-sm outline-none"/></label>{mensagem&&<p className="mt-3 text-sm text-brand">{mensagem}</p>}<div className="mt-4 divide-y divide-line/60">{pesquisa.pessoas.map(p=><button key={p.id} onClick={async()=>{try{await convidarParaGrupo(grupoId,p.id);setMensagem(`Convite enviado para ${p.nome}.`)}catch{setMensagem('Não foi possível enviar o convite.')}}} className="flex min-h-16 w-full items-center gap-3 text-left"><div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-card">{p.foto_url?<img src={p.foto_url} alt="" className="size-full object-cover"/>:p.nome?.[0]}</div><span className="text-sm font-semibold">{p.nome}</span></button>)}</div></div>
}
