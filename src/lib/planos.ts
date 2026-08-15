export type Plano = 'free' | 'basico' | 'premium'

export const ROTULO_PLANO: Record<Plano, string> = {
  free: 'Free',
  basico: 'Básico',
  premium: 'Premium',
}

export const LIMITE_SEMANA_FREE = 1
export const LIMITE_EXERCICIOS_FREE = 20
export const LIMITE_DIAS_DIARIO_BASICO = 7

/** Free só libera a semana 1 do plano de treino. */
export function semanaBloqueada(plano: Plano, semana: number): boolean {
  return plano === 'free' && semana > LIMITE_SEMANA_FREE
}

/** Free só libera os primeiros 20 exercícios da biblioteca (posição 0-indexada). */
export function exercicioBloqueado(plano: Plano, posicao: number): boolean {
  return plano === 'free' && posicao >= LIMITE_EXERCICIOS_FREE
}

/** Free e básico recalculam a meta manualmente; só o premium acompanha o desempenho automaticamente. */
export function recalculoAutomaticoBloqueado(plano: Plano): boolean {
  return plano !== 'premium'
}

/** Básico e free só enxergam os últimos 7 dias do diário; premium vê tudo. */
export function diaDoDiarioBloqueado(plano: Plano, diasAtras: number): boolean {
  return plano !== 'premium' && diasAtras > LIMITE_DIAS_DIARIO_BASICO
}
