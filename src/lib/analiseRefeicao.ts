import type { ItemIdentificado } from './services/foodScannerService.ts'

export type AjusteQuantidade = 'pouco' | 'medio' | 'muito'

const FATOR_AJUSTE: Record<AjusteQuantidade, number> = { pouco: 0.6, medio: 1, muito: 1.5 }

/** Recalcula kcal/macros de um item identificado quando o usuário corrige a quantidade. */
export function aplicarAjusteQuantidade(item: ItemIdentificado, ajuste: AjusteQuantidade): ItemIdentificado {
  const fator = FATOR_AJUSTE[ajuste]
  return {
    ...item,
    quantidadeEstimadaG: Math.round(item.quantidadeEstimadaG * fator),
    kcal: Math.round(item.kcal * fator),
    prot_g: Math.round(item.prot_g * fator * 10) / 10,
    carb_g: Math.round(item.carb_g * fator * 10) / 10,
    gord_g: Math.round(item.gord_g * fator * 10) / 10,
    fibra_g: Math.round(item.fibra_g * fator * 10) / 10,
  }
}

export type TotaisRefeicao = { kcal: number; prot_g: number; carb_g: number; gord_g: number; fibra_g: number }

export function somarItens(itens: ItemIdentificado[]): TotaisRefeicao {
  return itens.reduce(
    (t, i) => ({
      kcal: t.kcal + i.kcal,
      prot_g: t.prot_g + i.prot_g,
      carb_g: t.carb_g + i.carb_g,
      gord_g: t.gord_g + i.gord_g,
      fibra_g: t.fibra_g + i.fibra_g,
    }),
    { kcal: 0, prot_g: 0, carb_g: 0, gord_g: 0, fibra_g: 0 },
  )
}

export type NivelIndicador = 'boa' | 'moderada' | 'baixa'
export type NivelCarboidrato = 'baixo' | 'moderado' | 'alto'

export type AvaliacaoRefeicao = {
  proteina: NivelIndicador
  fibras: NivelIndicador
  carboidratos: NivelCarboidrato
  sugestoes: string[]
}

/**
 * Heurística simples e determinística — não é prescrição nutricional individualizada,
 * só uma leitura qualitativa dos macros estimados da refeição.
 * Proteína: ≥25g boa, 12-25g moderada, <12g baixa. Fibra: ≥6g boa, 3-6g moderada, <3g baixa.
 * Carboidrato é só descritivo (nunca "bom"/"ruim"): <20g baixo, 20-60g moderado, >60g alto.
 */
export function avaliarRefeicao(totais: TotaisRefeicao): AvaliacaoRefeicao {
  const proteina: NivelIndicador = totais.prot_g >= 25 ? 'boa' : totais.prot_g >= 12 ? 'moderada' : 'baixa'
  const fibras: NivelIndicador = totais.fibra_g >= 6 ? 'boa' : totais.fibra_g >= 3 ? 'moderada' : 'baixa'
  const carboidratos: NivelCarboidrato = totais.carb_g < 20 ? 'baixo' : totais.carb_g <= 60 ? 'moderado' : 'alto'

  const sugestoes: string[] = []
  if (fibras === 'baixa') sugestoes.push('Adicionar vegetais pode aumentar as fibras da refeição.')
  if (proteina === 'baixa') sugestoes.push('Você pode adicionar uma fonte proteica pra aumentar a proteína.')

  return { proteina, fibras, carboidratos, sugestoes }
}
