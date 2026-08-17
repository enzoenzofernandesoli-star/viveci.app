import type { GrupoMuscular } from '../data/exercicios.ts'
import { estimativa1RM } from './recordesPessoais.ts'

export type SerieParaDNA = {
  exercicio_id: number
  peso_kg: number
  reps: number
  data: string
  grupo_muscular: GrupoMuscular
}

export type DNATreino = {
  forca: number
  hipertrofia: number
  consistencia: number
  volume: number
  progressao: number
  equilibrio: number
}

export type PerfilDNA = { rotulo: string; descricao: string }

function clamp(valor: number): number {
  return Math.max(0, Math.min(100, Math.round(valor)))
}

function dentroDeDias(dataISO: string, referenciaISO: string, dias: number): boolean {
  const diff = (new Date(referenciaISO).getTime() - new Date(dataISO).getTime()) / (24 * 60 * 60 * 1000)
  return diff >= 0 && diff < dias
}

/**
 * DNA de treino: 6 indicadores 0-100 calculados sobre dados reais dos últimos 30/90 dias.
 * - consistência: sessões dos últimos 30 dias / meta mensal (dias/semana configurado × 4,3 semanas).
 * - volume: séries registradas nos últimos 30 dias / meta de séries mensais (meta de sessões × 12 séries).
 * - hipertrofia: % das séries dos últimos 30 dias feitas na faixa de 8-12 reps (hipertrofia clássica).
 * - progressão: % dos exercícios treinados nos últimos 30 dias que tiveram PR nesse período.
 * - força: variação média do 1RM estimado (Epley) entre a série mais antiga e mais recente de cada
 *   exercício nos últimos 90 dias, mapeada em torno de 50 (0% de ganho = 50).
 * - equilíbrio: 100 menos o maior desvio percentual entre os grupos musculares treinados no período.
 */
export function calcularDNA(
  series: SerieParaDNA[],
  ultimos30Dias: number,
  referenciaISO: string,
  diasSemanaConfigurado: number | null,
): DNATreino {
  const diasSemana = diasSemanaConfigurado && diasSemanaConfigurado > 0 ? diasSemanaConfigurado : 3
  const metaSessoesMes = diasSemana * 4.3
  const metaSetsMes = metaSessoesMes * 12

  const series30d = series.filter((s) => dentroDeDias(s.data, referenciaISO, 30))
  const series90d = series.filter((s) => dentroDeDias(s.data, referenciaISO, 90))

  const consistencia = clamp((ultimos30Dias / metaSessoesMes) * 100)
  const volume = clamp((series30d.length / metaSetsMes) * 100)

  const setsHipertrofia = series30d.filter((s) => s.reps >= 8 && s.reps <= 12).length
  const hipertrofia = series30d.length > 0 ? clamp((setsHipertrofia / series30d.length) * 100) : 0

  const progressao = calcularProgressao(series30d)
  const forca = calcularForca(series90d)
  const equilibrio = calcularEquilibrio(series30d)

  return { forca, hipertrofia, consistencia, volume, progressao, equilibrio }
}

function calcularProgressao(series30d: SerieParaDNA[]): number {
  const porExercicio = new Map<number, SerieParaDNA[]>()
  for (const s of series30d) {
    const lista = porExercicio.get(s.exercicio_id) ?? []
    lista.push(s)
    porExercicio.set(s.exercicio_id, lista)
  }
  if (porExercicio.size === 0) return 0

  let comPR = 0
  for (const lista of porExercicio.values()) {
    if (lista.length < 2) continue
    const ordenada = [...lista].sort((a, b) => a.data.localeCompare(b.data))
    const primeiro1rm = estimativa1RM(ordenada[0].peso_kg, ordenada[0].reps)
    const melhorDepois = Math.max(...ordenada.slice(1).map((s) => estimativa1RM(s.peso_kg, s.reps)))
    if (melhorDepois > primeiro1rm) comPR++
  }
  return clamp((comPR / porExercicio.size) * 100)
}

function calcularForca(series90d: SerieParaDNA[]): number {
  const porExercicio = new Map<number, SerieParaDNA[]>()
  for (const s of series90d) {
    const lista = porExercicio.get(s.exercicio_id) ?? []
    lista.push(s)
    porExercicio.set(s.exercicio_id, lista)
  }

  const variacoes: number[] = []
  for (const lista of porExercicio.values()) {
    if (lista.length < 2) continue
    const ordenada = [...lista].sort((a, b) => a.data.localeCompare(b.data))
    const rmInicial = estimativa1RM(ordenada[0].peso_kg, ordenada[0].reps)
    const rmFinal = estimativa1RM(ordenada[ordenada.length - 1].peso_kg, ordenada[ordenada.length - 1].reps)
    if (rmInicial > 0) variacoes.push(((rmFinal - rmInicial) / rmInicial) * 100)
  }
  if (variacoes.length === 0) return 50

  const mediaVariacao = variacoes.reduce((soma, v) => soma + v, 0) / variacoes.length
  return clamp(50 + mediaVariacao * 5)
}

function calcularEquilibrio(series30d: SerieParaDNA[]): number {
  const volumePorGrupo = new Map<GrupoMuscular, number>()
  for (const s of series30d) {
    volumePorGrupo.set(s.grupo_muscular, (volumePorGrupo.get(s.grupo_muscular) ?? 0) + s.peso_kg * s.reps)
  }
  const volumes = [...volumePorGrupo.values()]
  if (volumes.length < 2) return volumes.length === 1 ? 100 : 0

  const maior = Math.max(...volumes)
  if (maior === 0) return 0
  const percentuais = volumes.map((v) => (v / maior) * 100)
  const menor = Math.min(...percentuais)
  return clamp(menor)
}

/** Interpretação textual do DNA — combina o indicador mais forte com a consistência. */
export function interpretarDNA(dna: DNATreino): PerfilDNA {
  const indicadores: [keyof DNATreino, string][] = [
    ['forca', 'FORÇA'],
    ['hipertrofia', 'HIPERTROFIA'],
    ['volume', 'VOLUME'],
    ['progressao', 'PROGRESSÃO'],
  ]
  const [, rotuloMaior] = indicadores.reduce((maior, atual) => (dna[atual[0]] > dna[maior[0]] ? atual : maior))

  const consistente = dna.consistencia >= 70
  const semDados = dna.consistencia === 0 && dna.volume === 0 && dna.hipertrofia === 0 && dna.progressao === 0
  const rotulo = semDados ? 'SEM DADOS SUFICIENTES' : consistente ? `${rotuloMaior} CONSISTENTE` : rotuloMaior

  const descricao =
    semDados
      ? 'Ainda sem dados suficientes pra traçar seu perfil de treino.'
      : consistente
        ? `Seu ponto forte é ${rotuloMaior.toLowerCase()}, mantido com constância.`
        : `Seu ponto forte é ${rotuloMaior.toLowerCase()}, mas a consistência ainda pode melhorar.`

  return { rotulo, descricao }
}
