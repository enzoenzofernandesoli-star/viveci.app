const TOTAL_SEMANAS = 12

/**
 * Dado quantas sessões o usuário já concluiu no total, calcula qual é a
 * próxima (semana + posição na semana). Não depende de calendário — o plano
 * avança pelo ritmo real do usuário, não pelo dia da semana.
 */
export function calcularProximaSessao(
  sessoesPorSemana: number,
  sessoesConcluidas: number,
): { semana: number; ordemNaSemana: number; concluido: boolean } {
  const totalSessoes = sessoesPorSemana * TOTAL_SEMANAS
  if (sessoesConcluidas >= totalSessoes) {
    return { semana: TOTAL_SEMANAS, ordemNaSemana: sessoesPorSemana, concluido: true }
  }
  const semana = Math.floor(sessoesConcluidas / sessoesPorSemana) + 1
  const ordemNaSemana = (sessoesConcluidas % sessoesPorSemana) + 1
  return { semana, ordemNaSemana, concluido: false }
}
