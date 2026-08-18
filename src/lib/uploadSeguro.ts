export const MIME_IMAGEM_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const
export const TAMANHO_MAX_AVATAR = 5 * 1024 * 1024
export const TAMANHO_MAX_POST = 10 * 1024 * 1024
export const TAMANHO_MAX_PROGRESSO = 10 * 1024 * 1024

const EXTENSAO_POR_MIME: Record<(typeof MIME_IMAGEM_PERMITIDOS)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export type ArquivoImagem = { name: string; type: string; size: number }

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

