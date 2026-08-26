export type NivelSequencia = 'azul' | 'ferro' | 'bronze' | 'prata' | 'dourado'

export type ConquistaSequencia = {
  nivel: NivelSequencia
  nome: string
  diasNecessarios: number
  atingida: boolean
}

const MARCOS = [
  { nivel: 'azul', nome: 'Primeiro passo', diasNecessarios: 1 },
  { nivel: 'ferro', nome: 'Ferro', diasNecessarios: 14 },
  { nivel: 'bronze', nome: 'Bronze', diasNecessarios: 28 },
  { nivel: 'prata', nome: 'Prata', diasNecessarios: 42 },
  { nivel: 'dourado', nome: 'Dourado', diasNecessarios: 70 },
] as const

export function nivelDaSequencia(dias: number): NivelSequencia | null {
  if (dias < 1) return null
  if (dias >= 70) return 'dourado'
  if (dias >= 42) return 'prata'
  if (dias >= 28) return 'bronze'
  if (dias >= 14) return 'ferro'
  return 'azul'
}

export function conquistasDaSequencia(dias: number): ConquistaSequencia[] {
  return MARCOS.map((marco) => ({ ...marco, atingida: dias >= marco.diasNecessarios }))
}
