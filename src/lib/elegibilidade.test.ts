import assert from 'node:assert/strict'
import test from 'node:test'
import { IDADE_MINIMA, idadePermitida } from './elegibilidade.ts'

test('idade mínima do VIVECI é 18 anos', () => {
  assert.equal(IDADE_MINIMA, 18)
  assert.equal(idadePermitida(18), true)
})

test('recusa idade abaixo de 18 anos', () => {
  assert.equal(idadePermitida(17), false)
})

test('não impõe idade máxima', () => {
  assert.equal(idadePermitida(120), true)
})

test('recusa idade fracionária ou inválida', () => {
  assert.equal(idadePermitida(18.5), false)
  assert.equal(idadePermitida(Number.NaN), false)
})
