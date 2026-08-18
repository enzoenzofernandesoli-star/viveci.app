export const VERSAO_EXPORTACAO = 1

export function montarPacoteExportacao<T extends Record<string, unknown>>(userId: string, secoes: T, dataISO: string) {
  return { formato: 'viveci-export', versao: VERSAO_EXPORTACAO, usuario_id: userId, exportado_em: dataISO, ...secoes }
}
