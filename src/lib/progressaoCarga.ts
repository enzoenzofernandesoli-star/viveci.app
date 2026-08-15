import type { GrupoMuscular } from '../data/exercicios.ts'

const GRUPOS_INFERIORES: GrupoMuscular[] = ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha']

/** Membro inferior progride mais rápido (+5%) que superior (+2,5%). Abdômen não progride por carga. */
export function classificarMembro(grupo: GrupoMuscular): 'superior' | 'inferior' | 'core' {
  if (GRUPOS_INFERIORES.includes(grupo)) return 'inferior'
  if (grupo === 'Abdômen') return 'core'
  return 'superior'
}

/**
 * Sugere o próximo peso a partir do último registro. Só progride quando o
 * usuário completou todas as reps alvo — senão repete o peso anterior.
 * Arredonda pro meio quilo mais próximo (incremento comum de anilha).
 */
export function sugerirProximoPeso(
  pesoAnterior: number,
  repsCompletadas: number,
  repsAlvoMax: number,
  grupo: GrupoMuscular,
): number {
  if (repsCompletadas < repsAlvoMax) return pesoAnterior
  const membro = classificarMembro(grupo)
  const percentual = membro === 'inferior' ? 1.05 : membro === 'core' ? 1 : 1.025
  return Math.round(pesoAnterior * percentual * 2) / 2
}
