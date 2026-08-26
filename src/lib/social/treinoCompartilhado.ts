import { EXERCICIOS } from '../../data/exercicios.ts'
import { calcularPercentuais, calcularVolumePorGrupo, type PercentualPorGrupo } from '../mapaCorporal.ts'

export type ExercicioTreinoCompartilhado = {
  exercicioId: number
  nome: string
  series: number
  repsMin: number
  repsMax: number
  descansoSeg: number
}

export function normalizarExerciciosCompartilhados(valor: unknown): ExercicioTreinoCompartilhado[] {
  if (!Array.isArray(valor)) return []
  return valor.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const bruto = item as Record<string, unknown>
    const exercicioId = Number(bruto.exercicioId)
    const exercicio = EXERCICIOS.find((candidato) => candidato.id === exercicioId)
    if (!exercicio) return []
    return [{
      exercicioId,
      nome: typeof bruto.nome === 'string' && bruto.nome.trim() ? bruto.nome : exercicio.nome,
      series: Math.max(1, Number(bruto.series) || 1),
      repsMin: Math.max(1, Number(bruto.repsMin) || 1),
      repsMax: Math.max(1, Number(bruto.repsMax) || Number(bruto.repsMin) || 1),
      descansoSeg: Math.max(15, Number(bruto.descansoSeg) || 90),
    }]
  })
}

/** Intensidade relativa do treino, baseada na quantidade de séries por grupo. */
export function percentuaisDoTreinoCompartilhado(exercicios: ExercicioTreinoCompartilhado[]): PercentualPorGrupo {
  const registros = exercicios.map((item) => ({ exercicio_id: item.exercicioId, peso_kg: 1, reps: item.series }))
  return calcularPercentuais(calcularVolumePorGrupo(registros, EXERCICIOS))
}
