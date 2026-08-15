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

function chaveDia(data: Date): string {
  return data.toISOString().slice(0, 10)
}

/**
 * Quantos dias seguidos (até hoje) o usuário treinou pelo menos uma vez.
 * Se ainda não treinou hoje, a sequência conta a partir de ontem — treinar
 * mais tarde no dia não deveria "quebrar" a sequência que já existe.
 */
export function calcularStreak(datasConcluidasISO: string[], referenciaISO: string): number {
  const diasComTreino = new Set(datasConcluidasISO.map((d) => chaveDia(new Date(d))))

  const cursor = new Date(referenciaISO)
  if (!diasComTreino.has(chaveDia(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (diasComTreino.has(chaveDia(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
