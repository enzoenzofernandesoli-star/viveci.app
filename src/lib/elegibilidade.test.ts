import assert from 'node:assert/strict'
import test from 'node:test'
import { IDADE_MINIMA, idadePermitida } from './elegibilidade.ts'

test('idade mínima do VIVECI é 10 anos', () => {
  assert.equal(IDADE_MINIMA, 10)
  assert.equal(idadePermitida(10), true)
})

test('recusa idade abaixo de 10 anos', () => {
  assert.equal(idadePermitida(9), false)
})

test('não impõe idade máxima', () => {
  assert.equal(idadePermitida(120), true)
})

test('recusa idade fracionária ou inválida', () => {
  assert.equal(idadePermitida(10.5), false)
  assert.equal(idadePermitida(Number.NaN), false)
})
