// ─────────────────────────────────────────────────────────────
// MOCK DECLARADO — este serviço NÃO analisa a foto de verdade.
// Não há API de visão computacional configurada neste projeto ainda.
// A interface (FoodScannerService) é o ponto de troca: quando houver uma
// API real (ex: visão computacional via Supabase Edge Function), troque
// só a implementação abaixo — a UI que consome isso não muda.
// Ver CLAUDE.md, seção "VIVECI — IA de visão (mock declarado)".
// ─────────────────────────────────────────────────────────────

export type ItemIdentificado = {
  nome: string
  quantidadeEstimadaG: number
  kcal: number
  prot_g: number
  carb_g: number
  gord_g: number
  fibra_g: number
}

export type ResultadoScanRefeicao = {
  itens: ItemIdentificado[]
  confiancaPercentual: number
  /** sempre true nesta implementação — nunca omitir isso da UI */
  simulado: true
}

export interface FoodScannerService {
  analisarFoto(arquivo: File): Promise<ResultadoScanRefeicao>
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const PRATO_EXEMPLO: ItemIdentificado[] = [
  { nome: 'Frango grelhado', quantidadeEstimadaG: 120, kcal: 198, prot_g: 37, carb_g: 0, gord_g: 4.3, fibra_g: 0 },
  { nome: 'Arroz branco', quantidadeEstimadaG: 100, kcal: 130, prot_g: 2.7, carb_g: 28, gord_g: 0.3, fibra_g: 0.4 },
  { nome: 'Feijão carioca', quantidadeEstimadaG: 80, kcal: 98, prot_g: 6, carb_g: 18, gord_g: 0.4, fibra_g: 6.9 },
  { nome: 'Salada verde', quantidadeEstimadaG: 60, kcal: 12, prot_g: 1, carb_g: 2, gord_g: 0.1, fibra_g: 1.2 },
]

export const foodScannerServiceMock: FoodScannerService = {
  async analisarFoto(_arquivo: File): Promise<ResultadoScanRefeicao> {
    await esperar(1200)
    return { itens: PRATO_EXEMPLO, confiancaPercentual: 78, simulado: true }
  },
}

export const foodScannerService: FoodScannerService = foodScannerServiceMock
