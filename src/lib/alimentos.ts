import { PORCOES_ESPECIFICAS, type Alimento, type PorcaoAlimento } from '../data/alimentos.ts'

export type MacrosCalculados = {
  kcal: number
  prot_g: number
  carb_g: number
  gord_g: number
}

/** Calcula kcal e macros de um alimento pra uma quantidade em gramas, a partir dos valores por 100g. */
export function calcularMacrosPorQuantidade(alimento: Alimento, quantidadeGramas: number): MacrosCalculados {
  const fator = quantidadeGramas / 100
  return {
    kcal: Math.round(alimento.kcal_100 * fator),
    prot_g: Math.round(alimento.prot_100 * fator * 10) / 10,
    carb_g: Math.round(alimento.carb_100 * fator * 10) / 10,
    gord_g: Math.round(alimento.gord_100 * fator * 10) / 10,
  }
}

const GRAMAS: PorcaoAlimento = { id: 'gramas', singular: 'grama', plural: 'gramas', gramas: 1, passo: 5 }

const PORCOES_POR_CATEGORIA: Record<string, PorcaoAlimento[]> = {
  Proteína: [{ id: 'porcao', singular: 'porção', plural: 'porções', gramas: 100 }],
  Carboidrato: [{ id: 'porcao', singular: 'porção', plural: 'porções', gramas: 100 }],
  Leguminosa: [{ id: 'concha', singular: 'concha média', plural: 'conchas médias', gramas: 140 }],
  Fruta: [{ id: 'porcao', singular: 'porção', plural: 'porções', gramas: 100 }],
  Laticínio: [{ id: 'porcao', singular: 'porção', plural: 'porções', gramas: 100 }],
  Vegetal: [{ id: 'colher', singular: 'colher de servir', plural: 'colheres de servir', gramas: 60 }],
  Gordura: [{ id: 'colher', singular: 'colher de sopa', plural: 'colheres de sopa', gramas: 15 }],
  Bebida: [{ id: 'copo', singular: 'copo', plural: 'copos', gramas: 200 }],
  Suplemento: [{ id: 'scoop', singular: 'scoop', plural: 'scoops', gramas: 30 }],
  Outro: [{ id: 'porcao', singular: 'porção', plural: 'porções', gramas: 50 }],
  'Prato pronto': [{ id: 'porcao', singular: 'porção', plural: 'porções', gramas: 250 }],
  Lanche: [{ id: 'unidade', singular: 'unidade', plural: 'unidades', gramas: 100 }],
}

/** Retorna medidas caseiras adequadas ao alimento e mantém gramas como alternativa. */
export function obterPorcoesAlimento(alimento: Alimento): PorcaoAlimento[] {
  return [...(PORCOES_ESPECIFICAS[alimento.id] ?? PORCOES_POR_CATEGORIA[alimento.categoria] ?? []), GRAMAS]
}

/** Converte a quantidade escolhida na interface para o peso persistido no diário. */
export function converterPorcaoEmGramas(porcao: PorcaoAlimento, quantidade: number): number {
  if (!Number.isFinite(quantidade) || quantidade <= 0) return 0
  return Math.round(porcao.gramas * quantidade * 10) / 10
}

export function nomePorcao(porcao: PorcaoAlimento, quantidade: number): string {
  return quantidade === 1 ? porcao.singular : porcao.plural
}
