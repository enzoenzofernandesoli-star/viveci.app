import { test } from 'node:test'
import assert from 'node:assert/strict'
import { limiteRotinasAtingido, LIMITE_ROTINAS_FREE } from './planos.ts'

test('free bloqueia a partir de 4 rotinas', () => {
  assert.equal(limiteRotinasAtingido('free', 0), false)
  assert.equal(limiteRotinasAtingido('free', 3), false)
  assert.equal(limiteRotinasAtingido('free', 4), true)
  assert.equal(limiteRotinasAtingido('free', 5), true)
})

test('pro nunca é bloqueado', () => {
  assert.equal(limiteRotinasAtingido('pro', 0), false)
  assert.equal(limiteRotinasAtingido('pro', 4), false)
  assert.equal(limiteRotinasAtingido('pro', 100), false)
})

test('limite é 4', () => {
  assert.equal(LIMITE_ROTINAS_FREE, 4)
})
