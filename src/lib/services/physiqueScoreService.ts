// ─────────────────────────────────────────────────────────────
// MOCK DECLARADO — este serviço NÃO analisa o físico na foto de verdade.
// Não há IA de análise corporal configurada neste projeto. A interface
// (PhysiqueScoreService) é o ponto de troca pra uma implementação real
// depois. Ver CLAUDE.md, seção "VIVECI — IA de visão (mock declarado)".
// Nunca remover o aviso de simulação da UI que consome isso — mostrar uma
// nota de físico sem avisar que é inventada violaria a regra de nunca
// fingir precisão que o app não tem.
// ─────────────────────────────────────────────────────────────

export type PontuacaoFisico = {
  overall: number
  potencial: number
  definicao: number
  simetria: number
  vTaper: number
  massaMuscular: number
}

export type ResultadoAnaliseFisico = {
  pontuacao: PontuacaoFisico
  confiancaPercentual: number
  simulado: true
}

export interface PhysiqueScoreService {
  analisarFisico(arquivo: File): Promise<ResultadoAnaliseFisico>
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const PONTUACAO_EXEMPLO: PontuacaoFisico = {
  overall: 74,
  potencial: 82,
  definicao: 68,
  simetria: 79,
  vTaper: 71,
  massaMuscular: 76,
}

export const physiqueScoreServiceMock: PhysiqueScoreService = {
  async analisarFisico(_arquivo: File): Promise<ResultadoAnaliseFisico> {
    await esperar(1800)
    return { pontuacao: PONTUACAO_EXEMPLO, confiancaPercentual: 65, simulado: true }
  },
}

export const physiqueScoreService: PhysiqueScoreService = physiqueScoreServiceMock
