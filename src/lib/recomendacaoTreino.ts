import type { GrupoMuscular } from '../data/exercicios.ts'
import type { PercentualPorGrupo } from './mapaCorporal.ts'

export type RotinaParaRecomendacao = {
  id: string
  nome: string
  gruposMusculares: GrupoMuscular[]
}

export type RecomendacaoTreino = {
  rotinaId: string
  nome: string
  motivos: string[]
}

const DIA_MS = 24 * 60 * 60 * 1000

function diasDesde(dataISO: string | null, referenciaISO: string): number | null {
  if (!dataISO) return null
  const dias = Math.floor((new Date(referenciaISO).getTime() - new Date(dataISO).getTime()) / DIA_MS)
  return Math.max(0, dias)
}

function percentualMedio(grupos: GrupoMuscular[], percentuais: PercentualPorGrupo): number {
  if (grupos.length === 0) return 0
  return grupos.reduce((soma, g) => soma + percentuais[g], 0) / grupos.length
}

/**
 * Escolhe qual rotina do usuário treinar hoje.
 * Prioriza: 1) rotina nunca treinada, 2) rotina há mais dias sem estímulo,
 * 3) em empate, a rotina cujos grupos musculares têm menor volume relativo recente.
 * Uma rotina já treinada hoje só é recomendada de novo se for a única existente.
 */
export function recomendarTreinoHoje(
  rotinas: RotinaParaRecomendacao[],
  ultimoTreinoPorRotina: Record<string, string | null>,
  percentuaisPorGrupo: PercentualPorGrupo,
  referenciaISO: string,
): RecomendacaoTreino | null {
  if (rotinas.length === 0) return null

  const candidatas =
    rotinas.length > 1
      ? rotinas.filter((r) => diasDesde(ultimoTreinoPorRotina[r.id] ?? null, referenciaISO) !== 0)
      : rotinas
  const pool = candidatas.length > 0 ? candidatas : rotinas

  let melhor = pool[0]
  let melhorScore = -Infinity
  for (const rotina of pool) {
    const dias = diasDesde(ultimoTreinoPorRotina[rotina.id] ?? null, referenciaISO)
    const mediaVolume = percentualMedio(rotina.gruposMusculares, percentuaisPorGrupo)
    const score = (dias ?? 999) * 100 - mediaVolume
    if (score > melhorScore) {
      melhorScore = score
      melhor = rotina
    }
  }

  const diasMelhor = diasDesde(ultimoTreinoPorRotina[melhor.id] ?? null, referenciaISO)
  const mediaVolumeMelhor = percentualMedio(melhor.gruposMusculares, percentuaisPorGrupo)

  const motivos: string[] = []
  if (diasMelhor === null) {
    motivos.push('Você ainda não treinou esta rotina.')
  } else if (diasMelhor === 0) {
    motivos.push('É a única rotina disponível hoje.')
  } else {
    motivos.push(`${diasMelhor} ${diasMelhor === 1 ? 'dia' : 'dias'} desde o último estímulo.`)
  }
  if (mediaVolumeMelhor < 50) {
    motivos.push('Seu volume recente para estes grupos está abaixo da média.')
  }

  return { rotinaId: melhor.id, nome: melhor.nome, motivos }
}
