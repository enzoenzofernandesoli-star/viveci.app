import type { Exercicio, GrupoMuscular } from '../data/exercicios.ts'

export const GRUPOS_MUSCULARES: GrupoMuscular[] = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Quadríceps',
  'Posterior',
  'Glúteos',
  'Panturrilha',
  'Abdômen',
]

export type VolumePorGrupo = Record<GrupoMuscular, number>
export type PercentualPorGrupo = Record<GrupoMuscular, number>

export type RegistroParaMapa = {
  exercicio_id: number
  peso_kg: number
  reps: number
}

function volumeZerado(): VolumePorGrupo {
  const zerado = {} as VolumePorGrupo
  for (const g of GRUPOS_MUSCULARES) zerado[g] = 0
  return zerado
}

/**
 * volume_grupo = Σ (séries × reps × peso) dos últimos 7 dias.
 * Cada linha de `registros` já é uma série, então soma-se peso×reps por linha.
 * Exercício composto: 70% pro grupo primário, 30% dividido entre os secundários.
 */
export function calcularVolumePorGrupo(registros: RegistroParaMapa[], catalogo: Exercicio[]): VolumePorGrupo {
  const volumes = volumeZerado()

  for (const registro of registros) {
    const exercicio = catalogo.find((e) => e.id === registro.exercicio_id)
    if (!exercicio) continue

    const volumeSerie = registro.peso_kg * registro.reps

    if (exercicio.is_composto && exercicio.grupos_secundarios.length > 0) {
      volumes[exercicio.grupo_muscular] += volumeSerie * 0.7
      const porSecundario = (volumeSerie * 0.3) / exercicio.grupos_secundarios.length
      for (const secundario of exercicio.grupos_secundarios) {
        volumes[secundario] += porSecundario
      }
    } else {
      volumes[exercicio.grupo_muscular] += volumeSerie
    }
  }

  return volumes
}

/** percentual = round(volume_grupo / maior_volume × 100) */
export function calcularPercentuais(volumes: VolumePorGrupo): PercentualPorGrupo {
  const maior = Math.max(...Object.values(volumes))
  const percentuais = {} as PercentualPorGrupo
  for (const g of GRUPOS_MUSCULARES) {
    percentuais[g] = maior > 0 ? Math.round((volumes[g] / maior) * 100) : 0
  }
  return percentuais
}

const PARES_ANTAGONISTAS: [GrupoMuscular, GrupoMuscular][] = [
  ['Peito', 'Costas'],
  ['Bíceps', 'Tríceps'],
  ['Quadríceps', 'Posterior'],
]

export type Desequilibrio = {
  grupoMaisTreinado: GrupoMuscular
  grupoMenosTreinado: GrupoMuscular
  diferenca: number
}

export type MusculoNegligenciado = {
  grupo: GrupoMuscular
  percentual: number
  grupoReferencia: GrupoMuscular
  percentualReferencia: number
}

/**
 * Aponta o grupo muscular treinado com menor volume relativo ao grupo mais treinado.
 * Só alerta quando a diferença passa 30 pontos — evita ruído em treinos já equilibrados.
 * Grupos com percentual 0 (nunca treinados) não entram na comparação: isso é ausência
 * total, não negligência dentro de um programa em andamento.
 */
export function detectarMusculoNegligenciado(percentuais: PercentualPorGrupo): MusculoNegligenciado | null {
  const treinados = GRUPOS_MUSCULARES.filter((g) => percentuais[g] > 0)
  if (treinados.length < 2) return null

  const grupoReferencia = treinados.reduce((maior, g) => (percentuais[g] > percentuais[maior] ? g : maior))
  const grupo = treinados.reduce((menor, g) => (percentuais[g] < percentuais[menor] ? g : menor))
  const percentualReferencia = percentuais[grupoReferencia]
  const percentual = percentuais[grupo]

  if (grupo === grupoReferencia || percentualReferencia - percentual <= 30) return null
  return { grupo, percentual, grupoReferencia, percentualReferencia }
}

/** Alerta quando um grupo passa 25 pontos percentuais do seu antagonista. */
export function detectarDesequilibrios(percentuais: PercentualPorGrupo): Desequilibrio[] {
  const alertas: Desequilibrio[] = []
  for (const [a, b] of PARES_ANTAGONISTAS) {
    const diferenca = percentuais[a] - percentuais[b]
    if (Math.abs(diferenca) > 25) {
      alertas.push(
        diferenca > 0
          ? { grupoMaisTreinado: a, grupoMenosTreinado: b, diferenca }
          : { grupoMaisTreinado: b, grupoMenosTreinado: a, diferenca: -diferenca },
      )
    }
  }
  return alertas
}

const DIA_MS = 24 * 60 * 60 * 1000

export type EstatisticasGrupo = {
  treinos: number
  series: number
  volumeKg: number
  ultimoEstimuloDias: number | null
}

export type RegistroParaEstatisticas = RegistroParaMapa & { data: string }

/**
 * Estatísticas por grupo muscular pro painel de detalhe do mapa corporal
 * (clicar num músculo mostra isso). `treinos` = dias distintos com pelo
 * menos uma série que toca o grupo (primário ou secundário); `series` conta
 * toda série que toca o grupo, sem o split 70/30 usado no volume — aqui é
 * "quantas séries trabalharam esse músculo", não peso deslocado.
 */
export function calcularEstatisticasPorGrupo(
  registros: RegistroParaEstatisticas[],
  catalogo: Exercicio[],
  referenciaISO: string,
): Record<GrupoMuscular, EstatisticasGrupo> {
  const stats = {} as Record<GrupoMuscular, EstatisticasGrupo>
  for (const g of GRUPOS_MUSCULARES) stats[g] = { treinos: 0, series: 0, volumeKg: 0, ultimoEstimuloDias: null }

  const volumes = calcularVolumePorGrupo(registros, catalogo)
  for (const g of GRUPOS_MUSCULARES) stats[g].volumeKg = Math.round(volumes[g])

  const datasPorGrupo = {} as Record<GrupoMuscular, Set<string>>
  const ultimaDataPorGrupo = {} as Record<GrupoMuscular, string>
  for (const g of GRUPOS_MUSCULARES) datasPorGrupo[g] = new Set()

  for (const registro of registros) {
    const exercicio = catalogo.find((e) => e.id === registro.exercicio_id)
    if (!exercicio) continue
    for (const g of [exercicio.grupo_muscular, ...exercicio.grupos_secundarios]) {
      stats[g].series++
      datasPorGrupo[g].add(registro.data)
      if (!ultimaDataPorGrupo[g] || registro.data > ultimaDataPorGrupo[g]) ultimaDataPorGrupo[g] = registro.data
    }
  }

  const referencia = new Date(referenciaISO).getTime()
  for (const g of GRUPOS_MUSCULARES) {
    stats[g].treinos = datasPorGrupo[g].size
    const ultima = ultimaDataPorGrupo[g]
    stats[g].ultimoEstimuloDias = ultima ? Math.floor((referencia - new Date(ultima).getTime()) / DIA_MS) : null
  }

  return stats
}
