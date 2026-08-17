import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reconstruirTreinoExpress, type ItemParaExpress } from './treinoExpress.ts'

function item(parcial: Partial<ItemParaExpress> & { id: string; ordem: number }): ItemParaExpress {
  return { exercicioId: 1, nome: 'Exercício', isComposto: false, series: 3, descansoSeg: 90, ...parcial }
}

test('quando o tempo disponível já comporta tudo, nada muda', () => {
  const itens = [item({ id: 'a', ordem: 1, isComposto: true, series: 4, descansoSeg: 90 })]
  const r = reconstruirTreinoExpress(itens, 60)
  assert.equal(r.itens.length, 1)
  assert.equal(r.itens[0].status, 'mantido')
  assert.equal(r.itens[0].seriesFinal, 4)
})

test('reduz isolados antes de tocar em compostos', () => {
  const itens = [
    item({ id: 'composto', ordem: 1, isComposto: true, series: 4, descansoSeg: 90 }),
    item({ id: 'isolado', ordem: 2, isComposto: false, series: 4, descansoSeg: 90 }),
  ]
  const r = reconstruirTreinoExpress(itens, 8)
  const composto = r.todos.find((i) => i.id === 'composto')!
  const isolado = r.todos.find((i) => i.id === 'isolado')!
  assert.equal(composto.seriesFinal, 4)
  assert.equal(composto.status, 'mantido')
  assert.ok(isolado.seriesFinal < 4)
})

test('remove isolados do fim quando reduzir não basta', () => {
  const itens = [
    item({ id: 'composto', ordem: 1, isComposto: true, series: 3, descansoSeg: 90 }),
    item({ id: 'isolado1', ordem: 2, isComposto: false, series: 3, descansoSeg: 90 }),
    item({ id: 'isolado2', ordem: 3, isComposto: false, series: 3, descansoSeg: 90 }),
  ]
  const r = reconstruirTreinoExpress(itens, 3)
  const restantesIds = r.itens.map((i) => i.id)
  assert.ok(restantesIds.includes('composto'))
  assert.ok(!restantesIds.includes('isolado2') || !restantesIds.includes('isolado1'))
})

test('sempre mantém pelo menos 1 exercício mesmo com tempo muito curto', () => {
  const itens = [
    item({ id: 'a', ordem: 1, isComposto: true, series: 4, descansoSeg: 90 }),
    item({ id: 'b', ordem: 2, isComposto: true, series: 4, descansoSeg: 90 }),
  ]
  const r = reconstruirTreinoExpress(itens, 1)
  assert.equal(r.itens.length, 1)
})

test('nunca reduz abaixo de 2 séries', () => {
  const itens = [item({ id: 'a', ordem: 1, isComposto: true, series: 4, descansoSeg: 90 })]
  const r = reconstruirTreinoExpress(itens, 1)
  assert.equal(r.itens[0].seriesFinal, 2)
})

test('minutosReduzidos reflete o tempo cortado', () => {
  const itens = [item({ id: 'a', ordem: 1, isComposto: false, series: 4, descansoSeg: 90 })]
  const r = reconstruirTreinoExpress(itens, 2)
  assert.ok(r.minutosReduzidos > 0)
  assert.equal(r.minutosReduzidos, r.tempoOriginalMin - r.tempoEstimadoMin)
})
