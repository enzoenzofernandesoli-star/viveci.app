/** Ritmo em minutos por quilômetro. null quando não dá pra calcular (sem distância). */
export function calcularRitmo(distanciaKm: number, duracaoMin: number): number | null {
  if (distanciaKm <= 0) return null
  return Math.round((duracaoMin / distanciaKm) * 10) / 10
}

/** "5:30" a partir de 5.5 min/km. */
export function formatoRitmo(minPorKm: number): string {
  const min = Math.floor(minPorKm)
  const seg = Math.round((minPorKm - min) * 60)
  return `${min}:${String(seg).padStart(2, '0')}`
}
