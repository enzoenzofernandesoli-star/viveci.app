export type RegistroParaPR = {
  peso_kg: number
  reps: number
  data: string
}

export type RecordePessoal = {
  peso_kg: number
  reps: number
  data: string
  estimativa1rm: number
}

export type ResultadoPR = {
  isPR: boolean
  anterior: RecordePessoal | null
  atual: RecordePessoal
  variacaoPercentual: number | null
}

/** Fórmula de Epley: estima a carga de uma repetição só a partir de peso × reps feitas. */
export function estimativa1RM(pesoKg: number, reps: number): number {
  return pesoKg * (1 + reps / 30)
}

/** Melhor registro do histórico por 1RM estimado. null se o exercício nunca foi treinado. */
export function melhorRegistro(historico: RegistroParaPR[]): RecordePessoal | null {
  if (historico.length === 0) return null
  let melhor = historico[0]
  let melhor1rm = estimativa1RM(melhor.peso_kg, melhor.reps)
  for (const registro of historico) {
    const rm = estimativa1RM(registro.peso_kg, registro.reps)
    if (rm > melhor1rm) {
      melhor = registro
      melhor1rm = rm
    }
  }
  return { ...melhor, estimativa1rm: melhor1rm }
}

/**
 * Compara um registro novo contra o histórico anterior (sem incluir o próprio registro novo).
 * O primeiro registro de um exercício também conta como PR — é o recorde inicial.
 */
export function detectarPR(historicoAnterior: RegistroParaPR[], novoRegistro: RegistroParaPR): ResultadoPR {
  const anterior = melhorRegistro(historicoAnterior)
  const atual1rm = estimativa1RM(novoRegistro.peso_kg, novoRegistro.reps)
  const atual: RecordePessoal = { ...novoRegistro, estimativa1rm: atual1rm }

  if (!anterior) {
    return { isPR: true, anterior: null, atual, variacaoPercentual: null }
  }

  const isPR = atual1rm > anterior.estimativa1rm
  const variacaoPercentual = isPR ? Math.round(((atual1rm / anterior.estimativa1rm - 1) * 100) * 10) / 10 : null

  return { isPR, anterior, atual, variacaoPercentual }
}

export type EventoPR = {
  exercicioId: number
  atual: RecordePessoal
  variacaoPercentual: number
}

/**
 * Varre um histórico de registros (todos os exercícios juntos, qualquer ordem) e devolve
 * só os PRs que representam melhora real sobre um recorde anterior — o primeiro registro
 * de cada exercício nunca conta aqui, porque "bater o próprio recorde inicial" é ruído.
 */
export function detectarEventosPR(registros: (RegistroParaPR & { exercicio_id: number })[]): EventoPR[] {
  const porExercicio = new Map<number, RegistroParaPR[]>()
  const eventos: EventoPR[] = []
  const ordenados = [...registros].sort((a, b) => a.data.localeCompare(b.data))

  for (const r of ordenados) {
    const historico = porExercicio.get(r.exercicio_id) ?? []
    const resultado = detectarPR(historico, r)
    if (resultado.isPR && historico.length > 0 && resultado.variacaoPercentual !== null) {
      eventos.push({ exercicioId: r.exercicio_id, atual: resultado.atual, variacaoPercentual: resultado.variacaoPercentual })
    }
    historico.push(r)
    porExercicio.set(r.exercicio_id, historico)
  }

  return eventos
}
