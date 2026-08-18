const MENSAGENS_CONHECIDAS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de entrar.'],
  [/user already registered/i, 'Já existe uma conta com este e-mail.'],
  [/(failed to fetch|network|load failed)/i, 'Sem conexão com o VIVECI. Verifique sua internet e tente novamente.'],
]

export function mensagemErro(error: unknown, fallback: string): string {
  const detalhe = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  return MENSAGENS_CONHECIDAS.find(([padrao]) => padrao.test(detalhe))?.[1] ?? fallback
}
