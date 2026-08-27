import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { validarImagem, TAMANHO_MAX_AVATAR } from '../uploadSeguro'
import { LIMITE_NOME_GRUPO, normalizarDescricaoGrupo, normalizarNomeGrupo, validarSenhaGrupo } from './grupoRegras'
import { listarMensagensNaoLidas } from './mensagens'

export type VisibilidadeGrupo = 'aberto' | 'privado'
export type PapelGrupo = 'dono' | 'admin' | 'membro'

export type GrupoSocial = {
  id: string
  nome: string
  descricao: string | null
  fotoUrl: string | null
  visibilidade: VisibilidadeGrupo
  totalMembros: number
  souMembro: boolean
  meuPapel: PapelGrupo | null
  naoLidas: number
}

export type MembroGrupo = {
  userId: string
  nome: string
  fotoUrl: string | null
  papel: PapelGrupo
  mediaSemanal: number
}

export type SolicitacaoGrupo = { id: string; userId: string; nome: string; fotoUrl: string | null; criadaEm: string }

function mapearGrupo(item: Record<string, unknown>): GrupoSocial {
  return {
    id: String(item.id),
    nome: String(item.nome),
    descricao: item.descricao ? String(item.descricao) : null,
    fotoUrl: item.foto_url ? String(item.foto_url) : null,
    visibilidade: item.visibilidade as VisibilidadeGrupo,
    totalMembros: Number(item.total_membros ?? 0),
    souMembro: item.sou_membro === true,
    meuPapel: (item.meu_papel as PapelGrupo | null) ?? null,
    naoLidas: Number(item.nao_lidas ?? 0),
  }
}

export function useGrupos(termo = '') {
  const [grupos, setGrupos] = useState<GrupoSocial[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let cancelado = false
    const timer = window.setTimeout(async () => {
      setCarregando(true)
      setErro(null)
      const busca = termo.trim().replace(/[%_]/g, '').slice(0, LIMITE_NOME_GRUPO)
      const [{ data, error }, naoLidas] = await Promise.all([supabase.rpc('pesquisar_grupos', { p_busca: busca }), listarMensagensNaoLidas()])
      if (cancelado) return
      if (error) {
        setGrupos([])
        setErro('Não foi possível carregar os grupos agora.')
      } else {
        setGrupos(((data ?? []) as Record<string, unknown>[]).map((item) => ({ ...mapearGrupo(item), naoLidas: naoLidas.grupos.get(String(item.id)) ?? 0 })))
      }
      setCarregando(false)
    }, termo ? 300 : 0)
    return () => { cancelado = true; window.clearTimeout(timer) }
  }, [termo, versao])

  return { grupos, carregando, erro, recarregar: () => setVersao((v) => v + 1) }
}

export async function criarGrupo(dados: {
  nome: string
  descricao: string
  visibilidade: VisibilidadeGrupo
  senha: string
  foto: File | null
}): Promise<string> {
  const nome = normalizarNomeGrupo(dados.nome)
  if (nome.length < 3) throw new Error('O nome do grupo deve ter pelo menos 3 caracteres.')
  const senha = validarSenhaGrupo(dados.senha, dados.visibilidade === 'privado')
  const { data, error } = await supabase.rpc('criar_grupo', {
    p_nome: nome,
    p_descricao: normalizarDescricaoGrupo(dados.descricao) || null,
    p_visibilidade: dados.visibilidade,
    p_senha: senha,
  })
  if (error) throw error
  const grupoId = String(data)
  if (dados.foto) await atualizarFotoGrupo(grupoId, dados.foto)
  return grupoId
}

export async function solicitarEntradaGrupo(grupoId: string, senha?: string) {
  const { data, error } = await supabase.rpc('solicitar_entrada_grupo', { p_grupo_id: grupoId, p_senha: senha || null })
  if (error) throw error
  if (data === 'senha_incorreta') throw new Error('Senha incorreta.')
  return String(data)
}

export async function listarSolicitacoesGrupo(grupoId: string): Promise<SolicitacaoGrupo[]> {
  const { data, error } = await supabase.rpc('listar_solicitacoes_grupo', { p_grupo_id: grupoId })
  if (error) throw error
  return ((data ?? []) as Record<string, unknown>[]).map((item) => ({ id: String(item.id), userId: String(item.user_id), nome: String(item.nome), fotoUrl: item.foto_url ? String(item.foto_url) : null, criadaEm: String(item.criada_em) }))
}

export async function responderSolicitacaoGrupo(solicitacaoId: string, aceitar: boolean) {
  const { error } = await supabase.rpc('responder_solicitacao_grupo', { p_solicitacao_id: solicitacaoId, p_aceitar: aceitar })
  if (error) throw error
}

export async function atualizarGrupo(grupoId: string, dados: { nome: string; descricao: string; visibilidade: VisibilidadeGrupo; senha: string }) {
  const nome = normalizarNomeGrupo(dados.nome)
  if (nome.length < 3) throw new Error('O nome do grupo deve ter pelo menos 3 caracteres.')
  const senha = dados.senha ? validarSenhaGrupo(dados.senha, true) : null
  const { error } = await supabase.rpc('editar_grupo', {
    p_grupo_id: grupoId,
    p_nome: nome,
    p_descricao: normalizarDescricaoGrupo(dados.descricao) || null,
    p_visibilidade: dados.visibilidade,
    p_nova_senha: senha,
  })
  if (error) throw error
}

export async function atualizarFotoGrupo(grupoId: string, foto: File) {
  const { extensao } = validarImagem(foto, TAMANHO_MAX_AVATAR)
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Entre novamente para atualizar a foto.')
  const path = `${userData.user.id}/grupos/${grupoId}.${extensao}`
  const { error: uploadError } = await supabase.storage.from('midia-publica').upload(path, foto, { upsert: true, contentType: foto.type })
  if (uploadError) throw uploadError
  const fotoUrl = `${supabase.storage.from('midia-publica').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
  const { error } = await supabase.rpc('atualizar_foto_grupo', { p_grupo_id: grupoId, p_foto_url: fotoUrl, p_foto_path: path })
  if (error) throw error
}

export async function carregarGrupo(grupoId: string): Promise<GrupoSocial> {
  const { data, error } = await supabase.rpc('obter_grupo', { p_grupo_id: grupoId })
  if (error || !data?.length) throw new Error('Grupo não encontrado.')
  return mapearGrupo(data[0] as Record<string, unknown>)
}

export async function carregarMembrosGrupo(grupoId: string): Promise<MembroGrupo[]> {
  const { data, error } = await supabase.rpc('membros_e_rank_grupo', { p_grupo_id: grupoId })
  if (error) throw error
  return ((data ?? []) as Record<string, unknown>[]).map((m) => ({
    userId: String(m.user_id), nome: String(m.nome ?? 'Atleta VIVECI'),
    fotoUrl: m.foto_url ? String(m.foto_url) : null, papel: m.papel as PapelGrupo,
    mediaSemanal: Number(m.media_semanal ?? 0),
  }))
}

export async function alterarPapelMembro(grupoId: string, userId: string, papel: 'admin' | 'membro') {
  const { error } = await supabase.rpc('alterar_papel_grupo', { p_grupo_id: grupoId, p_user_id: userId, p_papel: papel })
  if (error) throw error
}

export async function removerMembroGrupo(grupoId: string, userId: string) {
  const { error } = await supabase.rpc('remover_membro_grupo', { p_grupo_id: grupoId, p_user_id: userId })
  if (error) throw error
}

export async function convidarParaGrupo(grupoId: string, userId: string) {
  const { error } = await supabase.rpc('convidar_para_grupo', { p_grupo_id: grupoId, p_user_id: userId })
  if (error) throw error
}
