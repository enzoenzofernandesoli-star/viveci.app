export type MetricasCompartilhadas = {
  duracaoSeg: number | null
  numeroSeries: number | null
  volumeTotalKg: number | null
}

export function filtrarMetricasCompartilhadas(dados: {
  mostrarDuracao: boolean
  mostrarSeries: boolean
  mostrarVolume: boolean
  duracaoSeg: number | null
  numeroSeries: number | null
  volumeTotalKg: number | null
}): MetricasCompartilhadas {
  return {
    duracaoSeg: dados.mostrarDuracao ? dados.duracaoSeg : null,
    numeroSeries: dados.mostrarSeries ? dados.numeroSeries : null,
    volumeTotalKg: dados.mostrarVolume ? dados.volumeTotalKg : null,
  }
}
