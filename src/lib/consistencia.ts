const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Quantas sessões de treino foram concluídas nos últimos 7 e 30 dias,
 * a partir de uma data de referência (normalmente hoje).
 */
export function calcularConsistencia(
  datasConcluidasISO: string[],
  referenciaISO: string,
): { ultimos7Dias: number; ultimos30Dias: number } {
  const referencia = new Date(referenciaISO).getTime()
  let ultimos7Dias = 0
  let ultimos30Dias = 0

  for (const dataISO of datasConcluidasISO) {
    const diffDias = (referencia - new Date(dataISO).getTime()) / DIA_MS
    if (diffDias < 0) continue
    if (diffDias < 7) ultimos7Dias++
    if (diffDias < 30) ultimos30Dias++
  }

  return { ultimos7Dias, ultimos30Dias }
}
