export const IDADE_MINIMA = 18

export function idadePermitida(idade: number): boolean {
  return Number.isInteger(idade) && idade >= IDADE_MINIMA
}
