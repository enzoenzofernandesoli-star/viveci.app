const ROTAS_PUSH_PERMITIDAS = ['/social', '/perfil', '/treino', '/corpo', '/nutricao'] as const

export function rotaPushSegura(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor.startsWith('/') || valor.startsWith('//')) return null
  return ROTAS_PUSH_PERMITIDAS.some((prefixo) => valor === prefixo || valor.startsWith(`${prefixo}/`)) ? valor : null
}
