export type EntradaDailyScore = {
  diasSemTreinar: number
  caloriasRegistradasHoje: number
  metaCalorias: number
  ultimos7Dias: number
  ultimos30Dias: number
  diasSemanaMeta: number
}

export type DailyScore = {
  treino: number
  alimentacao: number
  consistencia: number
  evolucao: number
  score: number
}

function clamp(valor: number): number {
  return Math.max(0, Math.min(100, Math.round(valor)))
}

/**
 * Indicador interno de acompanhamento do dia — não é nota de saúde.
 * - treino: 100 se treinou hoje, cai 15 pontos por dia sem treinar.
 * - alimentação: % da meta calórica já registrada hoje.
 * - consistência: sessões dos últimos 7 dias / meta semanal (dias/semana configurado).
 * - evolução: sessões dos últimos 30 dias / meta mensal (mesma meta, numa janela maior).
 * - score final: média simples dos quatro indicadores.
 */
export function calcularDailyScore(entrada: EntradaDailyScore): DailyScore {
  const diasSemana = entrada.diasSemanaMeta > 0 ? entrada.diasSemanaMeta : 3

  const treino = clamp(100 - entrada.diasSemTreinar * 15)
  const alimentacao = entrada.metaCalorias > 0 ? clamp((entrada.caloriasRegistradasHoje / entrada.metaCalorias) * 100) : 0
  const consistencia = clamp((entrada.ultimos7Dias / diasSemana) * 100)
  const evolucao = clamp((entrada.ultimos30Dias / (diasSemana * 4.3)) * 100)

  const score = clamp((treino + alimentacao + consistencia + evolucao) / 4)

  return { treino, alimentacao, consistencia, evolucao, score }
}
