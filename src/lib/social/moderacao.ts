import { supabase } from '../supabase'

export type CategoriaDenuncia = 'spam' | 'inadequado' | 'assedio' | 'enganoso' | 'outro'

export async function bloquearUsuario(meuId: string, usuarioId: string) {
  const { error } = await supabase.from('usuarios_bloqueados').insert({ bloqueador_id: meuId, bloqueado_id: usuarioId })
  if (error) throw error
}

export async function denunciarPost(meuId: string, postId: string, categoria: CategoriaDenuncia = 'outro') {
  const { error } = await supabase.from('denuncias_social').insert({ denunciante_id: meuId, tipo: 'post', post_id: postId, categoria })
  if (error) throw error
}

export async function denunciarComentario(meuId: string, comentarioId: string, categoria: CategoriaDenuncia = 'outro') {
  const { error } = await supabase.from('denuncias_social').insert({ denunciante_id: meuId, tipo: 'comentario', comentario_id: comentarioId, categoria })
  if (error) throw error
}

