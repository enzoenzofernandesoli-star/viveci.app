export type ItemParaExpress = {
  id: string
  exercicioId: number
  nome: string
  isComposto: boolean
  series: number
  descansoSeg: number
  ordem: number
}

export type StatusItemExpress = 'mantido' | 'reduzido' | 'removido'

export type ItemExpress = ItemParaExpress & { seriesFinal: number; status: StatusItemExpress }

export type ResultadoTreinoExpress = {
  itens: ItemExpress[]
  todos: ItemExpress[]
  tempoOriginalMin: number
  tempoEstimadoMin: number
  minutosReduzidos: number
}

const SEGUNDOS_POR_SERIE = 40
const SERIES_MINIMAS = 2

function tempoItemSeg(series: number, descansoSeg: number): number {
  if (series <= 0) return 0
  return series * SEGUNDOS_POR_SERIE + (series - 1) * descansoSeg
}

/**
 * Reconstrói uma sessão de treino pra caber no tempo disponível.
 * Prioridade: exercícios compostos mantidos íntegros o quanto possível; isolados
 * são reduzidos (menos séries, mínimo 2) e depois removidos primeiro, do fim da
 * rotina pro começo. Só reduz/remove compostos se ainda faltar tempo depois disso,
 * e sempre mantém pelo menos 1 exercício na sessão.
 */
export function reconstruirTreinoExpress(itens: ItemParaExpress[], minutosDisponiveis: number): ResultadoTreinoExpress {
  const ordenados = [...itens].sort((a, b) => Number(b.isComposto) - Number(a.isComposto) || a.ordem - b.ordem)
  const estados: ItemExpress[] = ordenados.map((i) => ({ ...i, seriesFinal: i.series, status: 'mantido' }))

  const tempoOriginalSeg = itens.reduce((soma, i) => soma + tempoItemSeg(i.series, i.descansoSeg), 0)
  const orcamentoSeg = minutosDisponiveis * 60
  const tempoAtualSeg = () =>
    estados.filter((e) => e.status !== 'removido').reduce((soma, e) => soma + tempoItemSeg(e.seriesFinal, e.descansoSeg), 0)

  function reduzir(filtro: (e: ItemExpress) => boolean) {
    for (let i = estados.length - 1; i >= 0 && tempoAtualSeg() > orcamentoSeg; i--) {
      const e = estados[i]
      if (e.status === 'removido' || !filtro(e)) continue
      while (e.seriesFinal > SERIES_MINIMAS && tempoAtualSeg() > orcamentoSeg) {
        e.seriesFinal--
        e.status = 'reduzido'
      }
    }
  }

  function remover(filtro: (e: ItemExpress) => boolean) {
    for (let i = estados.length - 1; i >= 0 && tempoAtualSeg() > orcamentoSeg; i--) {
      const restantes = estados.filter((e) => e.status !== 'removido').length
      if (restantes <= 1) break
      const e = estados[i]
      if (e.status === 'removido' || !filtro(e)) continue
      e.status = 'removido'
    }
  }

  reduzir((e) => !e.isComposto)
  remover((e) => !e.isComposto)
  reduzir((e) => e.isComposto)
  remover((e) => e.isComposto)

  const tempoEstimadoMin = Math.round(tempoAtualSeg() / 60)
  return {
    itens: estados.filter((e) => e.status !== 'removido'),
    todos: estados,
    tempoOriginalMin: Math.round(tempoOriginalSeg / 60),
    tempoEstimadoMin,
    minutosReduzidos: Math.round(tempoOriginalSeg / 60) - tempoEstimadoMin,
  }
}
