import { useState } from 'react'
import { Camera, Lock, Plus, Search, Users, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Empty } from './Empty'
import { criarGrupo, type VisibilidadeGrupo, useGrupos } from '../lib/social/grupos'

export function GruposSocial() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [criando, setCriando] = useState(false)
  const grupos = useGrupos(busca)

  if (criando) return <FormularioGrupo onFechar={() => setCriando(false)} onCriado={(id) => navigate(`/social/grupo/${id}`)} />

  const meus = grupos.grupos.filter((grupo) => grupo.souMembro)
  const explorar = grupos.grupos.filter((grupo) => !grupo.souMembro)

  return (
    <div className="pb-6 pt-5">
      <div className="flex items-center gap-2">
        <label className="campo-pesquisa flex min-h-12 flex-1 items-center gap-2 rounded-xl border border-line bg-card px-3 focus-within:border-brand">
          <Search size={17} className="text-ink-3" strokeWidth={1.75} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} maxLength={60} placeholder="Pesquisar grupos" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3" />
        </label>
        <button onClick={() => setCriando(true)} aria-label="Criar grupo" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <Plus size={20} strokeWidth={1.8} />
        </button>
      </div>

      {grupos.carregando ? <Empty text="Carregando grupos..." /> : grupos.erro ? <Empty text={grupos.erro} /> : (
        <>
          {!busca && meus.length > 0 && <ListaGrupos titulo="Meus grupos" grupos={meus} abrir={(id) => navigate(`/social/grupo/${id}`)} />}
          <ListaGrupos titulo={busca ? 'Resultados' : 'Explorar grupos'} grupos={busca ? grupos.grupos : explorar} abrir={(id) => navigate(`/social/grupo/${id}`)} />
          {grupos.grupos.length === 0 && (
            <div className="py-12 text-center">
              <Users size={28} className="mx-auto text-ink-3" strokeWidth={1.5} />
              <p className="mt-4 text-sm font-semibold">Nenhum grupo encontrado</p>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-ink-2">Crie o primeiro grupo e evolua o rank corporal junto com outras pessoas.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ListaGrupos({ titulo, grupos, abrir }: { titulo: string; grupos: ReturnType<typeof useGrupos>['grupos']; abrir: (id: string) => void }) {
  if (grupos.length === 0) return null
  return (
    <section className="mt-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-2">{titulo}</p>
      <div className="mt-3 divide-y divide-line/60 border-y border-line/60">
        {grupos.map((grupo) => (
          <button key={grupo.id} onClick={() => abrir(grupo.id)} className="flex min-h-20 w-full items-center gap-3 py-3 text-left">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-card">
              {grupo.fotoUrl ? <img src={grupo.fotoUrl} alt="" className="size-full object-cover" /> : <Users size={22} className="text-ink-3" strokeWidth={1.5} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">{grupo.nome}</p>
                {grupo.visibilidade === 'privado' && <Lock size={13} className="shrink-0 text-ink-3" />}
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-ink-2">{grupo.descricao || (grupo.visibilidade === 'privado' ? 'Grupo privado' : 'Grupo aberto')}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.06em] text-ink-3">{grupo.totalMembros} {grupo.totalMembros === 1 ? 'membro' : 'membros'}{grupo.souMembro ? ' · Você participa' : ''}</p>
            </div>
            {grupo.naoLidas > 0 && <span aria-label={`${grupo.naoLidas} mensagens não lidas`} className="flex min-w-6 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 py-1 text-[10px] font-bold text-white">{grupo.naoLidas > 99 ? '99+' : grupo.naoLidas}</span>}
          </button>
        ))}
      </div>
    </section>
  )
}

function FormularioGrupo({ onFechar, onCriado }: { onFechar: () => void; onCriado: (id: string) => void }) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [visibilidade, setVisibilidade] = useState<VisibilidadeGrupo>('aberto')
  const [senha, setSenha] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    setSalvando(true); setErro(null)
    try { onCriado(await criarGrupo({ nome, descricao, visibilidade, senha, foto })) }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível criar o grupo.') }
    finally { setSalvando(false) }
  }

  return (
    <section className="animar-entrada pt-5">
      <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.1em] text-ink-2">Novo grupo</p><h2 className="mt-1 text-xl font-semibold">Criar grupo</h2></div><button onClick={onFechar} aria-label="Fechar" className="flex size-11 items-center justify-center text-ink-2"><X size={20} /></button></div>
      <label className="mt-6 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card text-xs text-ink-2">
        <Camera size={22} className="mb-2" /><span>{foto ? foto.name : 'Escolher foto do grupo'}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
      </label>
      <label className="mt-5 block text-xs font-semibold text-ink-2">Nome<input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-3 text-sm text-ink outline-none focus:border-brand" /></label>
      <label className="mt-4 block text-xs font-semibold text-ink-2">Descrição<textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={280} rows={3} className="mt-2 w-full resize-none rounded-xl border border-line bg-card p-3 text-sm text-ink outline-none focus:border-brand" /></label>
      <div className="mt-4 grid grid-cols-2 gap-2">{(['aberto','privado'] as const).map((tipo) => <button key={tipo} onClick={() => setVisibilidade(tipo)} className={`min-h-12 rounded-xl border text-xs font-semibold capitalize ${visibilidade === tipo ? 'border-brand bg-brand/10 text-brand' : 'border-line text-ink-2'}`}>{tipo}</button>)}</div>
      {visibilidade === 'privado' && <label className="mt-4 block text-xs font-semibold text-ink-2">Senha para solicitar entrada<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} maxLength={72} className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-3 text-sm outline-none focus:border-brand" /><span className="mt-2 block font-normal leading-5">O grupo aparece na pesquisa. A senha valida a solicitação, que ainda precisa da aprovação de um administrador.</span></label>}
      {erro && <p role="alert" className="mt-4 text-sm text-down">{erro}</p>}
      <button disabled={salvando} onClick={salvar} className="mt-6 min-h-12 w-full rounded-xl bg-brand text-sm font-semibold text-white disabled:opacity-50">{salvando ? 'Criando...' : 'Criar grupo'}</button>
    </section>
  )
}
