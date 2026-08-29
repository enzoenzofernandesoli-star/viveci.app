export const MIME_IMAGEM_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const
export const TAMANHO_MAX_AVATAR = 5 * 1024 * 1024
export const TAMANHO_MAX_POST = 10 * 1024 * 1024
export const TAMANHO_MAX_PROGRESSO = 10 * 1024 * 1024
export const TAMANHO_MAX_MIDIA_CHAT = 15 * 1024 * 1024

const EXTENSAO_POR_MIME: Record<(typeof MIME_IMAGEM_PERMITIDOS)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export type ArquivoImagem = { name: string; type: string; size: number }

const MIME_AUDIO_CHAT: Record<string, string[]> = {
  'audio/webm': ['webm'],
  'audio/mp4': ['m4a', 'mp4'],
  'audio/mpeg': ['mp3'],
  'audio/ogg': ['ogg', 'oga'],
  'audio/wav': ['wav'],
  'audio/x-wav': ['wav'],
}

export function validarImagem(arquivo: ArquivoImagem, tamanhoMaximo: number): { extensao: string } {
  if (!MIME_IMAGEM_PERMITIDOS.includes(arquivo.type as (typeof MIME_IMAGEM_PERMITIDOS)[number])) {
    throw new Error('Use uma imagem JPG, PNG ou WebP.')
  }
  if (arquivo.size <= 0 || arquivo.size > tamanhoMaximo) {
    const limiteMb = Math.round(tamanhoMaximo / 1024 / 1024)
    throw new Error(`A imagem deve ter no máximo ${limiteMb} MB.`)
  }

  const extensao = arquivo.name.split('.').pop()?.toLowerCase()
  const esperada = EXTENSAO_POR_MIME[arquivo.type as keyof typeof EXTENSAO_POR_MIME]
  const equivalentes = esperada === 'jpg' ? ['jpg', 'jpeg'] : [esperada]
  if (!extensao || !equivalentes.includes(extensao)) throw new Error('A extensão do arquivo não corresponde ao tipo da imagem.')
  return { extensao: esperada }
}

export function validarMidiaChat(arquivo: ArquivoImagem): { tipo: 'imagem' | 'audio'; extensao: string } {
  if (arquivo.type.startsWith('image/')) {
    return { tipo: 'imagem', ...validarImagem(arquivo, 10 * 1024 * 1024) }
  }
  const extensoes = MIME_AUDIO_CHAT[arquivo.type]
  if (!extensoes) throw new Error('Use um áudio MP3, M4A, WebM, OGG ou WAV.')
  if (arquivo.size <= 0 || arquivo.size > TAMANHO_MAX_MIDIA_CHAT) throw new Error('O áudio deve ter no máximo 15 MB.')
  const extensao = arquivo.name.split('.').pop()?.toLowerCase()
  if (!extensao || !extensoes.includes(extensao)) throw new Error('A extensão do arquivo não corresponde ao tipo do áudio.')
  return { tipo: 'audio', extensao }
}
