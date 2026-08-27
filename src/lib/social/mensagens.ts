import { supabase } from '../supabase'

export type Mensagem = { id:number; remetenteId:string; texto:string|null; treinoId:string|null; criadaEm:string; nome:string; fotoUrl:string|null }
export type Conversa = { id:string; pessoaId:string; nome:string; fotoUrl:string|null; ultimaEm:string }
export type ConviteGrupo = { conviteId:string; grupoId:string; nome:string; fotoUrl:string|null; convidadoPor:string; expiraEm:string }

export async function abrirConversa(pessoaId:string) { const {data,error}=await supabase.rpc('abrir_conversa',{p_usuario_id:pessoaId}); if(error)throw error; return String(data) }

export async function listarConversas(meuId:string):Promise<Conversa[]> {
  const {data,error}=await supabase.from('conversas').select('id,usuario_a,usuario_b,atualizada_em').order('atualizada_em',{ascending:false}).limit(50); if(error)throw error
  const linhas=data??[], ids=linhas.map(c=>c.usuario_a===meuId?c.usuario_b:c.usuario_a)
  if(!ids.length)return []
  const {data:perfis,error:ep}=await supabase.from('perfis_publicos').select('id,nome,foto_url').in('id',ids); if(ep)throw ep
  const mapa=new Map((perfis??[]).map(p=>[p.id,p]))
  return linhas.map(c=>{const pessoaId=c.usuario_a===meuId?c.usuario_b:c.usuario_a,p=mapa.get(pessoaId);return{id:c.id,pessoaId,nome:p?.nome??'Atleta VIVECI',fotoUrl:p?.foto_url??null,ultimaEm:c.atualizada_em}})
}

export async function listarMensagens(destino:{conversaId?:string;grupoId?:string}, antes?:number):Promise<Mensagem[]> {
  let q=supabase.from('mensagens').select('id,remetente_id,texto,treino_id,criada_em').order('id',{ascending:false}).limit(40)
  q=destino.conversaId?q.eq('conversa_id',destino.conversaId):q.eq('grupo_id',destino.grupoId!)
  if(antes)q=q.lt('id',antes)
  const {data,error}=await q;if(error)throw error
  const ids=[...new Set((data??[]).map(m=>m.remetente_id))]
  if(!ids.length)return []
  const {data:perfis,error:ep}=await supabase.from('perfis_publicos').select('id,nome,foto_url').in('id',ids);if(ep)throw ep
  const mapa=new Map((perfis??[]).map(p=>[p.id,p]))
  return (data??[]).reverse().map(m=>({id:m.id,remetenteId:m.remetente_id,texto:m.texto,treinoId:m.treino_id,criadaEm:m.criada_em,nome:mapa.get(m.remetente_id)?.nome??'Atleta VIVECI',fotoUrl:mapa.get(m.remetente_id)?.foto_url??null}))
}

export async function enviarMensagem(destino:{conversaId?:string;grupoId?:string},texto:string,treinoId?:string){const {error}=await supabase.rpc('enviar_mensagem',{p_conversa_id:destino.conversaId??null,p_grupo_id:destino.grupoId??null,p_texto:texto||null,p_treino_id:treinoId??null});if(error)throw error}

export async function listarConvitesGrupo():Promise<ConviteGrupo[]>{const{data,error}=await supabase.rpc('listar_convites_grupo');if(error)throw error;return(data??[]).map((c:Record<string,unknown>)=>({conviteId:String(c.convite_id),grupoId:String(c.grupo_id),nome:String(c.nome),fotoUrl:c.foto_url?String(c.foto_url):null,convidadoPor:String(c.convidado_por),expiraEm:String(c.expira_em)}))}
export async function recusarConviteGrupo(conviteId:string){const{error}=await supabase.rpc('recusar_convite_grupo',{p_convite_id:conviteId});if(error)throw error}
