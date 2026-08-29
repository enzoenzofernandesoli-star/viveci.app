import { supabase } from '../supabase'
import { validarMidiaChat } from '../uploadSeguro'

export type Mensagem = { id:number; remetenteId:string; texto:string|null; treinoId:string|null; criadaEm:string; nome:string; fotoUrl:string|null; conviteId:string|null; conviteGrupoId:string|null; conviteGrupoNome:string|null; conviteGrupoFoto:string|null; conviteAtivo:boolean; treinoMarcadoId:string|null; treinoMarcadoLocal:string|null; treinoMarcadoEm:string|null; treinoMarcadoParticipantes:number; participandoTreino:boolean; midiaTipo:'imagem'|'audio'|null; midiaPath:string|null; midiaUrl:string|null }
export type Conversa = { id:string; pessoaId:string; nome:string; fotoUrl:string|null; ultimaEm:string; naoLidas:number }
export type PessoaConversa = { id:string; nome:string; fotoUrl:string|null }

export async function abrirConversa(pessoaId:string) { const {data,error}=await supabase.rpc('abrir_conversa',{p_usuario_id:pessoaId}); if(error)throw error; return String(data) }

export async function carregarPessoaConversa(conversaId:string,meuId:string):Promise<PessoaConversa>{const{data,error}=await supabase.from('conversas').select('usuario_a,usuario_b').eq('id',conversaId).single();if(error)throw error;const id=data.usuario_a===meuId?data.usuario_b:data.usuario_a;const{data:p,error:ep}=await supabase.from('perfis_publicos').select('id,nome,foto_url').eq('id',id).single();if(ep)throw ep;return{id:p.id,nome:p.nome??'Atleta VIVECI',fotoUrl:p.foto_url??null}}

export async function listarConversas(meuId:string):Promise<Conversa[]> {
  const [{data,error},naoLidas]=await Promise.all([supabase.from('conversas').select('id,usuario_a,usuario_b,atualizada_em').order('atualizada_em',{ascending:false}).limit(50),listarMensagensNaoLidas()]); if(error)throw error
  const linhas=data??[], ids=linhas.map(c=>c.usuario_a===meuId?c.usuario_b:c.usuario_a)
  if(!ids.length)return []
  const {data:perfis,error:ep}=await supabase.from('perfis_publicos').select('id,nome,foto_url').in('id',ids); if(ep)throw ep
  const mapa=new Map((perfis??[]).map(p=>[p.id,p]))
  return linhas.map(c=>{const pessoaId=c.usuario_a===meuId?c.usuario_b:c.usuario_a,p=mapa.get(pessoaId);return{id:c.id,pessoaId,nome:p?.nome??'Atleta VIVECI',fotoUrl:p?.foto_url??null,ultimaEm:c.atualizada_em,naoLidas:naoLidas.conversas.get(c.id)??0}})
}

export async function listarMensagensNaoLidas(){const{data,error}=await supabase.rpc('listar_mensagens_nao_lidas');if(error)throw error;const conversas=new Map<string,number>(),grupos=new Map<string,number>();for(const item of data??[]){const mapa=item.destino_tipo==='grupo'?grupos:conversas;mapa.set(String(item.destino_id),Number(item.quantidade))}return{conversas,grupos}}
export async function marcarMensagensComoLidas(destino:{conversaId?:string;grupoId?:string}){const{error}=await supabase.rpc('marcar_mensagens_lidas',{p_conversa_id:destino.conversaId??null,p_grupo_id:destino.grupoId??null});if(error)throw error}

export async function listarMensagens(destino:{conversaId?:string;grupoId?:string}, antes?:number):Promise<Mensagem[]> {
  const {data,error}=await supabase.rpc('listar_mensagens',{p_conversa_id:destino.conversaId??null,p_grupo_id:destino.grupoId??null,p_antes:antes??null});if(error)throw error
  const mensagens=((data??[]) as Record<string,unknown>[]).reverse().map((m):Mensagem=>({id:Number(m.id),remetenteId:String(m.remetente_id),texto:m.texto?String(m.texto):null,treinoId:m.treino_id?String(m.treino_id):null,criadaEm:String(m.criada_em),nome:String(m.nome??'Atleta VIVECI'),fotoUrl:m.foto_url?String(m.foto_url):null,conviteId:m.convite_id?String(m.convite_id):null,conviteGrupoId:m.convite_grupo_id?String(m.convite_grupo_id):null,conviteGrupoNome:m.convite_grupo_nome?String(m.convite_grupo_nome):null,conviteGrupoFoto:m.convite_grupo_foto?String(m.convite_grupo_foto):null,conviteAtivo:m.convite_ativo===true,treinoMarcadoId:m.treino_marcado_id?String(m.treino_marcado_id):null,treinoMarcadoLocal:m.treino_marcado_local?String(m.treino_marcado_local):null,treinoMarcadoEm:m.treino_marcado_em?String(m.treino_marcado_em):null,treinoMarcadoParticipantes:Number(m.treino_marcado_participantes??0),participandoTreino:m.participando_treino===true,midiaTipo:m.midia_tipo==='imagem'||m.midia_tipo==='audio'?m.midia_tipo:null,midiaPath:m.midia_path?String(m.midia_path):null,midiaUrl:null}))
  const paths=[...new Set(mensagens.flatMap((m)=>m.midiaPath?[m.midiaPath]:[]))]
  if(paths.length){const{data:urls,error:erroUrls}=await supabase.storage.from('chat-privado').createSignedUrls(paths,3600);if(erroUrls)throw erroUrls;const mapa=new Map((urls??[]).map((item)=>[item.path,item.signedUrl]));for(const mensagem of mensagens)if(mensagem.midiaPath)mensagem.midiaUrl=mapa.get(mensagem.midiaPath)??null}
  return mensagens
}

export async function enviarMensagem(destino:{conversaId?:string;grupoId?:string},texto:string,treinoId?:string){const {error}=await supabase.rpc('enviar_mensagem',{p_conversa_id:destino.conversaId??null,p_grupo_id:destino.grupoId??null,p_texto:texto||null,p_treino_id:treinoId??null});if(error)throw error}
export async function excluirMensagem(mensagemId:number,midiaPath?:string|null){const{error}=await supabase.rpc('excluir_mensagem',{p_mensagem_id:mensagemId});if(error)throw error;if(midiaPath)await supabase.storage.from('chat-privado').remove([midiaPath])}

export async function marcarTreino(destino:{conversaId?:string;grupoId?:string},local:string,dataHora:string){const{error}=await supabase.rpc('marcar_treino',{p_conversa_id:destino.conversaId??null,p_grupo_id:destino.grupoId??null,p_local:local.trim(),p_data_hora:new Date(dataHora).toISOString()});if(error)throw error}
export async function participarTreino(treinoMarcadoId:string){const{error}=await supabase.rpc('participar_treino_marcado',{p_treino_marcado_id:treinoMarcadoId});if(error)throw error}

export async function enviarMidia(destino:{conversaId?:string;grupoId?:string},arquivo:File){
  const sessao=(await supabase.auth.getSession()).data.session
  if(!sessao)throw new Error('Autenticação necessária.')
  const validacao=validarMidiaChat(arquivo),tipoDestino=destino.conversaId?'conversas':'grupos',destinoId=destino.conversaId??destino.grupoId
  if(!destinoId)throw new Error('Destino inválido.')
  const path=`${tipoDestino}/${destinoId}/${sessao.user.id}/${crypto.randomUUID()}.${validacao.extensao}`
  const{error:erroUpload}=await supabase.storage.from('chat-privado').upload(path,arquivo,{contentType:arquivo.type,upsert:false});if(erroUpload)throw erroUpload
  const{error}=await supabase.rpc('enviar_midia_mensagem',{p_conversa_id:destino.conversaId??null,p_grupo_id:destino.grupoId??null,p_midia_path:path});if(error){await supabase.storage.from('chat-privado').remove([path]);throw error}
}

export async function recusarConviteGrupo(conviteId:string){const{error}=await supabase.rpc('recusar_convite_grupo',{p_convite_id:conviteId});if(error)throw error}
export async function aceitarConviteGrupo(grupoId:string){const{data,error}=await supabase.rpc('entrar_grupo',{p_grupo_id:grupoId,p_senha:null});if(error)throw error;if(data!=='entrou')throw new Error('Este convite não está mais disponível.')}
