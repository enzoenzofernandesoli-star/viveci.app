import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularConsistencia, calcularStreak } from './consistencia.ts'

const HOJE = '2026-08-15T12:00:00.000Z'

test('conta sessões dentro dos últimos 7 dias', () => {
  const datas = [
    '2026-08-15T09:00:00.000Z', // hoje
    '2026-08-10T09:00:00.000Z', // 5 dias atrás
    '2026-08-01T09:00:00.000Z', // 14 dias atrás
  ]
  const r = calcularConsistencia(datas, HOJE)
  assert.equal(r.ultimos7Dias, 2)
})

test('conta sessões dentro dos últimos 30 dias', () => {
  const datas = [
    '2026-08-15T09:00:00.000Z',
    '2026-08-01T09:00:00.000Z', // 14 dias
    '2026-07-01T09:00:00.000Z', // 45 dias, fora
  ]
  const r = calcularConsistencia(datas, HOJE)
  assert.equal(r.ultimos30Dias, 2)
})

test('ignora sessões no futuro', () => {
  const datas = ['2026-08-20T09:00:00.000Z']
  const r = calcularConsistencia(datas, HOJE)
  assert.equal(r.ultimos7Dias, 0)
  assert.equal(r.ultimos30Dias, 0)
})

test('sem sessões, tudo zero', () => {
  const r = calcularConsistencia([], HOJE)
  assert.deepEqual(r, { ultimos7Dias: 0, ultimos30Dias: 0 })
})

test('streak conta dias seguidos até hoje', () => {
  const datas = ['2026-08-15T09:00:00.000Z', '2026-08-14T09:00:00.000Z', '2026-08-13T09:00:00.000Z']
  assert.equal(calcularStreak(datas, HOJE), 3)
})

test('streak não quebra se ainda não treinou hoje, mas treinou ontem', () => {
  const datas = ['2026-08-14T09:00:00.000Z', '2026-08-13T09:00:00.000Z']
  assert.equal(calcularStreak(datas, HOJE), 2)
})

test('streak zera com um dia de furo', () => {
  const datas = ['2026-08-15T09:00:00.000Z', '2026-08-13T09:00:00.000Z']
  assert.equal(calcularStreak(datas, HOJE), 1)
})

test('streak zero sem nenhum treino', () => {
  assert.equal(calcularStreak([], HOJE), 0)
})

test('streak zero se o último treino foi há 2 dias ou mais', () => {
  const datas = ['2026-08-12T09:00:00.000Z']
  assert.equal(calcularStreak(datas, HOJE), 0)
})
