export const TAMANHO_MINIMO_SENHA = 8

export function validarNovaSenha(senha: string, confirmacao: string): string | null {
  if (senha.length < TAMANHO_MINIMO_SENHA) return `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`
  if (senha !== confirmacao) return 'As senhas não coincidem.'
  return null
}

export function validarNovoEmail(emailAtual: string, novoEmail: string): string | null {
  const normalizado = novoEmail.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado)) return 'Informe um e-mail válido.'
  if (normalizado === emailAtual.trim().toLowerCase()) return 'O novo e-mail precisa ser diferente do atual.'
  return null
}
