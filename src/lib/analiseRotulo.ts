import type { RotuloNutricional } from './services/labelScannerService.ts'

export type ExplicacaoRotulo = {
  proteina: string
  acucar: string
  sodio: string
  calorias: string
}

/**
 * Traduz os números do rótulo pra linguagem simples. Thresholds por porção
 * (não por 100g): proteína ≥8g/3-8g/<3g, açúcar <5g/5-15g/>15g,
 * sódio <140mg/140-400mg/>400mg (referência comum de rotulagem), calorias
 * <150/150-400/>400 kcal. Nunca classifica o alimento como "bom" ou "ruim" —
 * só descreve o dado.
 */
export function explicarRotulo(rotulo: RotuloNutricional): ExplicacaoRotulo {
  const proteina =
    rotulo.proteina_g >= 8
      ? 'Boa quantidade para um lanche.'
      : rotulo.proteina_g >= 3
        ? 'Quantidade moderada.'
        : 'Quantidade baixa.'

  const acucar = rotulo.acucares_g < 5 ? 'Baixo.' : rotulo.acucares_g <= 15 ? 'Moderado.' : 'Alto.'

  const sodio = rotulo.sodio_mg < 140 ? 'Baixo.' : rotulo.sodio_mg <= 400 ? 'Moderado.' : 'Alto.'

  const calorias =
    rotulo.kcal < 150
      ? 'Compatível com uma refeição leve.'
      : rotulo.kcal <= 400
        ? 'Compatível com uma refeição média.'
        : 'Calórico para uma porção só.'

  return { proteina, acucar, sodio, calorias }
}

export type ConsumoPorcao = {
  porcoesConsumidas: number
  kcalTotal: number
  proteinaTotal_g: number
  carbTotal_g: number
  gorduraTotal_g: number
  sodioTotal_mg: number
  alertaMultiplasPorcoes: boolean
}

/** gramas / porção do rótulo → quantas porções a pessoa realmente comeu, e o total real. */
export function calcularConsumoPorPorcao(rotulo: RotuloNutricional, gramasConsumidos: number): ConsumoPorcao {
  const porcoesConsumidas = Math.round((gramasConsumidos / rotulo.porcaoG) * 100) / 100

  return {
    porcoesConsumidas,
    kcalTotal: Math.round(rotulo.kcal * porcoesConsumidas),
    proteinaTotal_g: Math.round(rotulo.proteina_g * porcoesConsumidas * 10) / 10,
    carbTotal_g: Math.round(rotulo.carb_g * porcoesConsumidas * 10) / 10,
    gorduraTotal_g: Math.round(rotulo.gordura_g * porcoesConsumidas * 10) / 10,
    sodioTotal_mg: Math.round(rotulo.sodio_mg * porcoesConsumidas),
    alertaMultiplasPorcoes: porcoesConsumidas > 1.2,
  }
}
