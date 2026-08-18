export const LIMITE_BIO = 240
export const LIMITE_LEGENDA = 2200
export const LIMITE_COMENTARIO = 500

export function validarTextoSocial(texto: string, limite: number, campo: string): string {
  const limpo = texto.trim()
  if (limpo.length > limite) throw new Error(`${campo} deve ter no máximo ${limite} caracteres.`)
  return limpo
}

