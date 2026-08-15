import type { Alimento } from '../data/alimentos.ts'

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
