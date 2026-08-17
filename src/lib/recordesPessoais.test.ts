import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectarEventosPR, detectarPR, estimativa1RM, melhorRegistro } from './recordesPessoais.ts'

test('estimativa1RM usa fórmula de Epley', () => {
  assert.equal(Math.round(estimativa1RM(80, 8) * 100) / 100, 101.33)
})

test('melhorRegistro retorna null sem histórico', () => {
  assert.equal(melhorRegistro([]), null)
})

test('melhorRegistro escolhe o de maior 1RM estimado, não o de maior peso bruto', () => {
  const historico = [
    { peso_kg: 100, reps: 1, data: '2026-01-01' },
    { peso_kg: 80, reps: 8, data: '2026-01-05' },
  ]
  const melhor = melhorRegistro(historico)
  assert.equal(melhor?.peso_kg, 100)
})

test('primeiro registro do exercício é PR', () => {
  const r = detectarPR([], { peso_kg: 60, reps: 10, data: '2026-01-01' })
  assert.equal(r.isPR, true)
  assert.equal(r.anterior, null)
  assert.equal(r.variacaoPercentual, null)
})

test('caso de referência: 80kg×8 -> 82,5kg×8 é PR de +3,1%', () => {
  const historico = [{ peso_kg: 80, reps: 8, data: '2026-01-01' }]
  const r = detectarPR(historico, { peso_kg: 82.5, reps: 8, data: '2026-01-08' })
  assert.equal(r.isPR, true)
  assert.equal(r.variacaoPercentual, 3.1)
})

test('registro pior que o histórico não é PR', () => {
  const historico = [{ peso_kg: 80, reps: 8, data: '2026-01-01' }]
  const r = detectarPR(historico, { peso_kg: 70, reps: 8, data: '2026-01-08' })
  assert.equal(r.isPR, false)
  assert.equal(r.variacaoPercentual, null)
})

test('detectarEventosPR ignora o primeiro registro de cada exercício', () => {
  const eventos = detectarEventosPR([{ exercicio_id: 1, peso_kg: 80, reps: 8, data: '2026-01-01' }])
  assert.equal(eventos.length, 0)
})

test('detectarEventosPR registra melhora real sobre o recorde anterior', () => {
  const registros = [
    { exercicio_id: 1, peso_kg: 80, reps: 8, data: '2026-01-01' },
    { exercicio_id: 1, peso_kg: 82.5, reps: 8, data: '2026-01-08' },
  ]
  const eventos = detectarEventosPR(registros)
  assert.equal(eventos.length, 1)
  assert.equal(eventos[0].variacaoPercentual, 3.1)
})

test('detectarEventosPR não conta registro que só repete o recorde', () => {
  const registros = [
    { exercicio_id: 1, peso_kg: 80, reps: 8, data: '2026-01-01' },
    { exercicio_id: 1, peso_kg: 80, reps: 8, data: '2026-01-08' },
  ]
  assert.equal(detectarEventosPR(registros).length, 0)
})
