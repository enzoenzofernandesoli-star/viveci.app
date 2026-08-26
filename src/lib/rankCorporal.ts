import { GRUPOS_MUSCULARES, type PercentualPorGrupo } from './mapaCorporal.ts'

export const RANKS_CORPORAIS = [
  { nome: 'Ferro', minimo: 0, cor: '#697384' },
  { nome: 'Bronze', minimo: 25, cor: '#A66A3F' },
  { nome: 'Prata', minimo: 45, cor: '#BFC3CA' },
  { nome: 'Ouro', minimo: 60, cor: '#F5A524' },
  { nome: 'Platina', minimo: 72, cor: '#2DD4BF' },
  { nome: 'Diamante', minimo: 82, cor: '#60A5FA' },
  { nome: 'Ascendente', minimo: 90, cor: '#22C55E' },
  { nome: 'Imortal', minimo: 96, cor: '#D946EF' },
  { nome: 'Radiante', minimo: 99, cor: '#F4F5F7' },
] as const

export type RankCorporal = {
  nome: (typeof RANKS_CORPORAIS)[number]['nome']
  indice: number
  cor: string
  mediaSemanal: number
  progressoNoRank: number
  pontosParaProximo: number
  proximoRank: (typeof RANKS_CORPORAIS)[number]['nome'] | null
}

export function calcularMediaCorporal(percentuais: PercentualPorGrupo): number {
  const soma = GRUPOS_MUSCULARES.reduce((total, grupo) => total + percentuais[grupo], 0)
  return Math.round(soma / GRUPOS_MUSCULARES.length)
}

export function calcularRankCorporal(percentuais: PercentualPorGrupo): RankCorporal {
  const mediaSemanal = calcularMediaCorporal(percentuais)
  let indice = 0
  for (let i = 0; i < RANKS_CORPORAIS.length; i++) {
    if (mediaSemanal >= RANKS_CORPORAIS[i].minimo) indice = i
  }

  const atual = RANKS_CORPORAIS[indice]
  const proximo = RANKS_CORPORAIS[indice + 1]
  const progressoNoRank = proximo
    ? Math.round(((mediaSemanal - atual.minimo) / (proximo.minimo - atual.minimo)) * 100)
    : 100

  return {
    nome: atual.nome,
    indice,
    cor: atual.cor,
    mediaSemanal,
    progressoNoRank: Math.max(0, Math.min(100, progressoNoRank)),
    pontosParaProximo: proximo ? Math.max(0, proximo.minimo - mediaSemanal) : 0,
    proximoRank: proximo?.nome ?? null,
  }
}
