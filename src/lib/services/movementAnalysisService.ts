// ─────────────────────────────────────────────────────────────
// MOCK DECLARADO — este serviço NÃO analisa o movimento de verdade.
// Não há modelo de pose estimation/visão computacional configurado neste
// projeto. A interface (MovementAnalysisService) é o ponto de troca pra uma
// implementação real depois. Nunca reportar "lesão" ou fazer diagnóstico
// médico aqui — só feedback de movimento, e só quando for real.
// Ver CLAUDE.md, seção "VIVECI — IA de visão (mock declarado)".
// ─────────────────────────────────────────────────────────────

export type ResultadoAnaliseMovimento = {
  feedback: string
  simulado: true
}

export interface MovementAnalysisService {
  analisarVideo(arquivo: File, exercicioNome: string): Promise<ResultadoAnaliseMovimento>
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const movementAnalysisServiceMock: MovementAnalysisService = {
  async analisarVideo(_arquivo: File, _exercicioNome: string): Promise<ResultadoAnaliseMovimento> {
    await esperar(1200)
    return {
      feedback:
        'Isso é uma simulação — a análise real de movimento ainda não está conectada. Quando estiver, o feedback aparecerá aqui, sem diagnóstico médico.',
      simulado: true,
    }
  },
}

export const movementAnalysisService: MovementAnalysisService = movementAnalysisServiceMock
