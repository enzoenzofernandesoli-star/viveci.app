export const REFEICOES = [
  'Café da manhã',
  'Lanche da manhã',
  'Almoço',
  'Lanche da tarde',
  'Jantar',
  'Ceia',
  'Pré-treino',
  'Pós-treino',
] as const

export type Refeicao = (typeof REFEICOES)[number]

/** Sempre visíveis, mesmo sem registro. As demais só aparecem quando têm item. */
export const REFEICOES_PRINCIPAIS: Refeicao[] = [
  'Café da manhã',
  'Almoço',
  'Lanche da tarde',
  'Jantar',
]
