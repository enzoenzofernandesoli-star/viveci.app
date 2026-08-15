import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularRitmo, formatoRitmo } from './ritmo.ts'

test('calcula minutos por km', () => {
  assert.equal(calcularRitmo(5, 30), 6) // 30min / 5km = 6 min/km
})

test('sem distância devolve null', () => {
  assert.equal(calcularRitmo(0, 30), null)
})

test('formata ritmo com segundos', () => {
  assert.equal(formatoRitmo(6), '6:00')
  assert.equal(formatoRitmo(5.5), '5:30')
})
