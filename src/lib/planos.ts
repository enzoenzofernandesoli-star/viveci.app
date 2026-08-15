export type Plano = 'free' | 'pro'

export const ROTULO_PLANO: Record<Plano, string> = {
  free: 'Free',
  pro: 'Pro',
}

/** Free só pode ter até 4 rotinas de treino. Pro não tem limite. */
export const LIMITE_ROTINAS_FREE = 4

export function limiteRotinasAtingido(plano: Plano, totalRotinas: number): boolean {
  return plano === 'free' && totalRotinas >= LIMITE_ROTINAS_FREE
}
