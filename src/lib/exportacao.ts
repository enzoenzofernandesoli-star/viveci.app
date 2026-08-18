export const VERSAO_EXPORTACAO = 1

const CHAVE_SENSIVEL = /(^|_)(access_token|refresh_token|token|password|senha|secret|service_role|apikey)($|_)/i

function removerSegredos(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(removerSegredos)
  if (!valor || typeof valor !== 'object') return valor
  return Object.fromEntries(
    Object.entries(valor as Record<string, unknown>)
      .filter(([chave]) => !CHAVE_SENSIVEL.test(chave))
      .map(([chave, conteudo]) => [chave, removerSegredos(conteudo)]),
  )
}

export function montarPacoteExportacao<T extends Record<string, unknown>>(userId: string, secoes: T, dataISO: string) {
  return removerSegredos({ formato: 'viveci-export', versao: VERSAO_EXPORTACAO, usuario_id: userId, exportado_em: dataISO, ...secoes }) as
    { formato: 'viveci-export'; versao: number; usuario_id: string; exportado_em: string } & T
}
