import type { Exercicio, GrupoMuscular } from '../data/exercicios'
import type { Nivel, Objetivo, Biotipo, LocalTreino } from './perfil'

export type EntradaTreino = {
  nivel: Nivel
  objetivo: Objetivo
  biotipo: Biotipo
  local_treino: LocalTreino
  dias_semana: number
  tempo_sessao_min: number
}

export type Tecnica = 'normal' | 'avancada'

export type ItemTreino = {
  exercicio_id: number
  series: number
  reps_min: number
  reps_max: number
  descanso_seg: number
  tecnica: Tecnica
}

export type SessaoTreino = {
  ordem: number
  nome_sessao: string
  grupos: GrupoMuscular[]
  itens: ItemTreino[]
  cardio_min: number | null
}

export type SemanaTreino = {
  semana: number
  deload: boolean
  sessoes: SessaoTreino[]
}

export type PlanoTreino = {
  semanas: SemanaTreino[]
}

const EQUIPAMENTOS_CASA = new Set(['Peso corporal', 'Halter', 'Elástico'])

type Divisao = { nome: string; grupos: GrupoMuscular[] }[]

const DIVISOES: Record<number, Divisao> = {
  1: [{ nome: 'Corpo inteiro', grupos: ['Quadríceps', 'Posterior', 'Glúteos', 'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen'] }],
  2: [
    { nome: 'Full Body A', grupos: ['Quadríceps', 'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen'] },
    { nome: 'Full Body B', grupos: ['Posterior', 'Glúteos', 'Costas', 'Peito', 'Ombros', 'Tríceps', 'Bíceps', 'Abdômen'] },
  ],
  3: [
    { nome: 'Push', grupos: ['Peito', 'Ombros', 'Tríceps'] },
    { nome: 'Pull', grupos: ['Costas', 'Bíceps'] },
    { nome: 'Legs', grupos: ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 'Abdômen'] },
  ],
  4: [
    { nome: 'Peito e Tríceps', grupos: ['Peito', 'Tríceps'] },
    { nome: 'Costas e Bíceps', grupos: ['Costas', 'Bíceps'] },
    { nome: 'Pernas', grupos: ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha'] },
    { nome: 'Ombros e Abdômen', grupos: ['Ombros', 'Abdômen'] },
  ],
  5: [
    { nome: 'Peito', grupos: ['Peito'] },
    { nome: 'Costas', grupos: ['Costas'] },
    { nome: 'Pernas', grupos: ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha'] },
    { nome: 'Ombros e Abdômen', grupos: ['Ombros', 'Abdômen'] },
    { nome: 'Braços', grupos: ['Bíceps', 'Tríceps'] },
  ],
  6: [
    { nome: 'Push', grupos: ['Peito', 'Ombros', 'Tríceps'] },
    { nome: 'Pull', grupos: ['Costas', 'Bíceps'] },
    { nome: 'Legs', grupos: ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 'Abdômen'] },
    { nome: 'Push', grupos: ['Peito', 'Ombros', 'Tríceps'] },
    { nome: 'Pull', grupos: ['Costas', 'Bíceps'] },
    { nome: 'Legs', grupos: ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 'Abdômen'] },
  ],
}

function divisaoParaFrequencia(dias: number): Divisao {
  const chave = Math.min(Math.max(dias, 1), 6)
  return DIVISOES[chave]
}

const VOLUME_NIVEL: Record<Nivel, { exercicios: number; series: number; reps_min: number; reps_max: number; descanso_seg: number }> = {
  iniciante: { exercicios: 5, series: 3, reps_min: 10, reps_max: 12, descanso_seg: 60 },
  intermediario: { exercicios: 6, series: 3, reps_min: 8, reps_max: 12, descanso_seg: 60 },
  avancado: { exercicios: 7, series: 4, reps_min: 6, reps_max: 12, descanso_seg: 90 },
}

function aplicarObjetivo(
  objetivo: Objetivo,
  base: { reps_min: number; reps_max: number; descanso_seg: number },
  isComposto: boolean,
): { reps_min: number; reps_max: number; descanso_seg: number } {
  switch (objetivo) {
    case 'emagrecer':
      return { reps_min: 12, reps_max: 15, descanso_seg: 45 }
    case 'definir':
      return { ...base, reps_min: 10, reps_max: 15 }
    case 'ganhar_massa':
      return { reps_min: 8, reps_max: 12, descanso_seg: 90 }
    case 'forca':
      return isComposto ? { reps_min: 4, reps_max: 6, descanso_seg: 120 } : base
    case 'condicionamento':
      return { ...base, descanso_seg: 30 }
    default:
      return base
  }
}

/** Escolhe exercícios de um grupo, priorizando compostos, respeitando o local de treino. */
function exerciciosDoGrupo(catalogo: Exercicio[], grupo: GrupoMuscular, local: LocalTreino): Exercicio[] {
  return catalogo
    .filter((e) => e.grupo_muscular === grupo)
    .filter((e) => local === 'academia' || EQUIPAMENTOS_CASA.has(e.equipamento))
    .sort((a, b) => (a.is_composto === b.is_composto ? a.id - b.id : a.is_composto ? -1 : 1))
}

function montarSessao(
  catalogo: Exercicio[],
  divisao: { nome: string; grupos: GrupoMuscular[] },
  ordem: number,
  entrada: EntradaTreino,
): SessaoTreino {
  const volume = VOLUME_NIVEL[entrada.nivel]
  const ectomorfo = entrada.biotipo === 'ectomorfo'
  const endomorfo = entrada.biotipo === 'endomorfo'

  const totalExercicios = Math.max(1, volume.exercicios - (ectomorfo ? 1 : 0))
  const seriesTotaisAlvo = Math.max(1, Math.round(entrada.tempo_sessao_min / 3))

  const disponiveis = divisao.grupos.flatMap((g) => exerciciosDoGrupo(catalogo, g, entrada.local_treino))
  const escolhidos: Exercicio[] = []
  const usados = new Set<number>()
  let i = 0
  while (escolhidos.length < totalExercicios && i < disponiveis.length) {
    const ex = disponiveis[i]
    if (!usados.has(ex.id)) {
      escolhidos.push(ex)
      usados.add(ex.id)
    }
    i++
  }

  const deltaBiotipo = ectomorfo ? 15 : endomorfo ? -15 : 0

  const itens: ItemTreino[] = escolhidos.map((ex) => {
    const ajustado = aplicarObjetivo(entrada.objetivo, volume, ex.is_composto)
    return {
      exercicio_id: ex.id,
      series: volume.series,
      reps_min: ajustado.reps_min,
      reps_max: ajustado.reps_max,
      descanso_seg: Math.max(15, ajustado.descanso_seg + deltaBiotipo),
      tecnica: 'normal',
    }
  })

  // séries_totais ≈ minutos / 3: se o alvo pede mais séries que o padrão do nível, distribui nos compostos primeiro.
  let seriesAtuais = itens.reduce((s, it) => s + it.series, 0)
  let idx = 0
  while (seriesAtuais < seriesTotaisAlvo && itens.length > 0) {
    const item = itens[idx % itens.length]
    const exercicio = escolhidos[idx % itens.length]
    if (exercicio.is_composto) {
      item.series += 1
      seriesAtuais += 1
    }
    idx++
    if (idx > itens.length * 4) break
  }

  const grupos = Array.from(new Set(divisao.grupos))

  return {
    ordem,
    nome_sessao: divisao.nome,
    grupos,
    itens,
    cardio_min: endomorfo ? 15 : null,
  }
}

function aplicarProgressao(sessao: SessaoTreino, catalogo: Exercicio[], semana: number, nivel: Nivel): SessaoTreino {
  if (semana <= 4) return sessao

  let itens = sessao.itens
  if (semana >= 5) {
    itens = itens.map((it) => {
      const exercicio = catalogo.find((e) => e.id === it.exercicio_id)
      return exercicio?.is_composto ? { ...it, series: it.series + 1 } : it
    })
  }

  if (semana >= 9 && semana <= 11 && nivel !== 'iniciante') {
    const indice = itens.findIndex((it) => catalogo.find((e) => e.id === it.exercicio_id)?.is_composto)
    if (indice !== -1) {
      itens = itens.map((it, i) => (i === indice ? { ...it, tecnica: 'avancada' as Tecnica } : it))
    }
  }

  if (semana === 12) {
    itens = itens.map((it) => ({ ...it, series: Math.max(1, Math.round(it.series * 0.6)) }))
  }

  return { ...sessao, itens }
}

/**
 * Gera o plano de 12 semanas. Função pura e determinística: mesmo perfil,
 * mesmo catálogo de exercícios, sempre o mesmo plano.
 */
export function gerarPlanoTreino(entrada: EntradaTreino, catalogo: Exercicio[]): PlanoTreino {
  const divisao = divisaoParaFrequencia(entrada.dias_semana)
  const sessoesBase = divisao.map((d, i) => montarSessao(catalogo, d, i + 1, entrada))

  const semanas: SemanaTreino[] = Array.from({ length: 12 }, (_, i) => {
    const semana = i + 1
    const sessoes = sessoesBase.map((s) => aplicarProgressao(s, catalogo, semana, entrada.nivel))
    return { semana, deload: semana === 12, sessoes }
  })

  return { semanas }
}
