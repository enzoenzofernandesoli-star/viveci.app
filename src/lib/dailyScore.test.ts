import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularDailyScore } from './dailyScore.ts'

test('dia perfeito bate 100 em tudo', () => {
  const r = calcularDailyScore({
    diasSemTreinar: 0,
    caloriasRegistradasHoje: 2000,
    metaCalorias: 2000,
    ultimos7Dias: 5,
    ultimos30Dias: 21.5,
    diasSemanaMeta: 5,
  })
  assert.equal(r.treino, 100)
  assert.equal(r.alimentacao, 100)
  assert.equal(r.consistencia, 100)
  assert.equal(r.evolucao, 100)
  assert.equal(r.score, 100)
})

test('sem nenhum dado, tudo zerado', () => {
  const r = calcularDailyScore({
    diasSemTreinar: 10,
    caloriasRegistradasHoje: 0,
    metaCalorias: 2000,
    ultimos7Dias: 0,
    ultimos30Dias: 0,
    diasSemanaMeta: 5,
  })
  assert.equal(r.treino, 0)
  assert.equal(r.alimentacao, 0)
  assert.equal(r.consistencia, 0)
  assert.equal(r.evolucao, 0)
  assert.equal(r.score, 0)
})

test('treino cai 15 pontos por dia sem treinar', () => {
  const r = calcularDailyScore({
    diasSemTreinar: 2,
    caloriasRegistradasHoje: 0,
    metaCalorias: 2000,
    ultimos7Dias: 0,
    ultimos30Dias: 0,
    diasSemanaMeta: 5,
  })
  assert.equal(r.treino, 70)
})

test('alimentação nunca passa de 100 mesmo registrando acima da meta', () => {
  const r = calcularDailyScore({
    diasSemTreinar: 0,
    caloriasRegistradasHoje: 3000,
    metaCalorias: 2000,
    ultimos7Dias: 5,
    ultimos30Dias: 21.5,
    diasSemanaMeta: 5,
  })
  assert.equal(r.alimentacao, 100)
})

test('score é a média dos quatro indicadores', () => {
  const r = calcularDailyScore({
    diasSemTreinar: 0,
    caloriasRegistradasHoje: 1000,
    metaCalorias: 2000,
    ultimos7Dias: 5,
    ultimos30Dias: 21.5,
    diasSemanaMeta: 5,
  })
  assert.equal(r.score, Math.round((r.treino + r.alimentacao + r.consistencia + r.evolucao) / 4))
})
