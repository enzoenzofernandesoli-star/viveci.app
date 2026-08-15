import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularProximaSessao } from './progressaoTreino.ts'

test('primeira sessão do plano', () => {
  assert.deepEqual(calcularProximaSessao(4, 0), { semana: 1, ordemNaSemana: 1, concluido: false })
})

test('avança pra próxima sessão dentro da mesma semana', () => {
  assert.deepEqual(calcularProximaSessao(4, 2), { semana: 1, ordemNaSemana: 3, concluido: false })
})

test('vira a semana quando completa todas as sessões da semana', () => {
  assert.deepEqual(calcularProximaSessao(4, 4), { semana: 2, ordemNaSemana: 1, concluido: false })
})

test('plano de 12 semanas termina após a última sessão', () => {
  const totalSessoes = 4 * 12
  assert.deepEqual(calcularProximaSessao(4, totalSessoes), { semana: 12, ordemNaSemana: 4, concluido: true })
})

test('não estoura além do total mesmo com mais sessões concluídas que o plano tem', () => {
  const totalSessoes = 3 * 12
  assert.deepEqual(calcularProximaSessao(3, totalSessoes + 10), { semana: 12, ordemNaSemana: 3, concluido: true })
})
