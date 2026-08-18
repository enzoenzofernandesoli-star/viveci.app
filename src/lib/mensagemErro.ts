const MENSAGENS_CONHECIDAS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de entrar.'],
  [/user already registered/i, 'Já existe uma conta com este e-mail.'],
  [/(row-level security|permission denied|not authorized|jwt|42501)/i, 'Sua sessão não permite esta ação. Entre novamente e tente de novo.'],
  [/(duplicate key|unique constraint|23505)/i, 'Este registro já foi salvo. Atualize a tela antes de tentar novamente.'],
  [/(violates.*constraint|check constraint|23514)/i, 'Os dados informados não são válidos. Revise os campos e tente novamente.'],
  [/(timeout|timed out|504)/i, 'A operação demorou demais. Verifique sua conexão e tente novamente.'],
  [/(failed to fetch|network|load failed)/i, 'Sem conexão com o VIVECI. Verifique sua internet e tente novamente.'],
]

export function mensagemErro(error: unknown, fallback: string): string {
  const detalhe = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  return MENSAGENS_CONHECIDAS.find(([padrao]) => padrao.test(detalhe))?.[1] ?? fallback
}
