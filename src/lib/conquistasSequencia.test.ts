import assert from 'node:assert/strict'
import test from 'node:test'
import { conquistasDaSequencia, nivelDaSequencia } from './conquistasSequencia.ts'

test('não mostra braço sem sequência', () => assert.equal(nivelDaSequencia(0), null))
test('usa azul antes de duas semanas', () => assert.equal(nivelDaSequencia(13), 'azul'))
test('libera ferro, bronze, prata e dourado nos marcos', () => {
  assert.equal(nivelDaSequencia(14), 'ferro')
  assert.equal(nivelDaSequencia(28), 'bronze')
  assert.equal(nivelDaSequencia(42), 'prata')
  assert.equal(nivelDaSequencia(70), 'dourado')
})
test('conta conquistas atingidas', () => {
  assert.equal(conquistasDaSequencia(42).filter((item) => item.atingida).length, 4)
})
