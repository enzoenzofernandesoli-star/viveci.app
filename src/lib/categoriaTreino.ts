import type { GrupoMuscular } from '../data/exercicios.ts'

export type CategoriaTreino = 'push' | 'pull' | 'legs' | 'fullbody'
export type CategoriaVisualTreino = CategoriaTreino | 'cardio'

const ARQUIVOS_CATEGORIA: Record<CategoriaVisualTreino, string> = {
  push: 'push.webp',
  pull: 'pull.webp',
  legs: 'legs.webp',
  fullbody: 'fullbody.webp',
  cardio: 'cardio.webp',
}

export function arquivoCategoriaTreino(categoria: string | null): string | null {
  if (!categoria || !(categoria in ARQUIVOS_CATEGORIA)) return null
  return ARQUIVOS_CATEGORIA[categoria as CategoriaVisualTreino]
}

type ExercicioParaCategoria = {
  grupo_muscular: GrupoMuscular
  grupos_secundarios?: GrupoMuscular[]
}

const DOMINIO: Record<Exclude<CategoriaTreino, 'fullbody'>, GrupoMuscular[]> = {
  push: ['Peito', 'Ombros', 'Tríceps'],
  pull: ['Costas', 'Bíceps'],
  legs: ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha'],
}

export function classificarRotina(exercicios: ExercicioParaCategoria[]): CategoriaTreino | null {
  if (exercicios.length === 0) return null

  const pontos = { push: 0, pull: 0, legs: 0 }
  for (const exercicio of exercicios) {
    for (const categoria of Object.keys(DOMINIO) as (keyof typeof DOMINIO)[]) {
      if (DOMINIO[categoria].includes(exercicio.grupo_muscular)) pontos[categoria] += 2
      for (const secundario of exercicio.grupos_secundarios ?? []) {
        if (DOMINIO[categoria].includes(secundario)) pontos[categoria] += 1
      }
    }
  }

  const ativos = Object.entries(pontos).filter(([, valor]) => valor > 0)
  if (ativos.length === 0) return 'fullbody'
  if (ativos.length === 3 && Math.min(...ativos.map(([, valor]) => valor)) >= 2) return 'fullbody'

  const ordenados = (Object.entries(pontos) as [Exclude<CategoriaTreino, 'fullbody'>, number][]).sort((a, b) => b[1] - a[1])
  if (ordenados[0][1] === ordenados[1][1]) return 'fullbody'
  return ordenados[0][0]
}
