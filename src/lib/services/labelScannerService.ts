// ─────────────────────────────────────────────────────────────
// MOCK DECLARADO — este serviço NÃO faz OCR de verdade na foto do rótulo.
// Não há API de OCR/visão configurada neste projeto ainda. A interface
// (LabelScannerService) é o ponto de troca pra uma implementação real depois.
// Ver CLAUDE.md, seção "VIVECI — IA de visão (mock declarado)".
// ─────────────────────────────────────────────────────────────

export type RotuloNutricional = {
  produto: string
  porcaoG: number
  kcal: number
  carb_g: number
  acucares_g: number
  proteina_g: number
  gordura_g: number
  gordura_saturada_g: number
  fibra_g: number
  sodio_mg: number
}

export type ResultadoScanRotulo = {
  rotulo: RotuloNutricional
  confiancaPercentual: number
  simulado: true
}

export interface LabelScannerService {
  escanearRotulo(arquivo: File): Promise<ResultadoScanRotulo>
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const ROTULO_EXEMPLO: RotuloNutricional = {
  produto: 'Barra de cereal com whey',
  porcaoG: 30,
  kcal: 120,
  carb_g: 14,
  acucares_g: 6,
  proteina_g: 8,
  gordura_g: 3,
  gordura_saturada_g: 1,
  fibra_g: 2,
  sodio_mg: 45,
}

export const labelScannerServiceMock: LabelScannerService = {
  async escanearRotulo(_arquivo: File): Promise<ResultadoScanRotulo> {
    await esperar(1000)
    return { rotulo: ROTULO_EXEMPLO, confiancaPercentual: 84, simulado: true }
  },
}

export const labelScannerService: LabelScannerService = labelScannerServiceMock
