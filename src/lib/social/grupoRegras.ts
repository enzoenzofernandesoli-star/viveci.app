export const LIMITE_NOME_GRUPO = 60
export const LIMITE_DESCRICAO_GRUPO = 280
export const LIMITE_SENHA_GRUPO = 72

export function normalizarNomeGrupo(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ').slice(0, LIMITE_NOME_GRUPO)
}

export function normalizarDescricaoGrupo(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ').slice(0, LIMITE_DESCRICAO_GRUPO)
}

export function validarSenhaGrupo(senha: string, obrigatoria: boolean): string | null {
  if (!senha && !obrigatoria) return null
  if (senha.length < 6 || senha.length > LIMITE_SENHA_GRUPO) {
    throw new Error('A senha do grupo deve ter entre 6 e 72 caracteres.')
  }
  return senha
}

