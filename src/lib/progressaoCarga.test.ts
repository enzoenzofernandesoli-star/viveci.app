import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sugerirProximoPeso, classificarMembro } from './progressaoCarga.ts'

test('classifica grupos inferiores corretamente', () => {
  assert.equal(classificarMembro('Quadríceps'), 'inferior')
  assert.equal(classificarMembro('Posterior'), 'inferior')
  assert.equal(classificarMembro('Glúteos'), 'inferior')
  assert.equal(classificarMembro('Panturrilha'), 'inferior')
})

test('classifica grupos superiores corretamente', () => {
  assert.equal(classificarMembro('Peito'), 'superior')
  assert.equal(classificarMembro('Costas'), 'superior')
  assert.equal(classificarMembro('Ombros'), 'superior')
  assert.equal(classificarMembro('Bíceps'), 'superior')
  assert.equal(classificarMembro('Tríceps'), 'superior')
})

test('abdômen é core, não progride por percentual', () => {
  assert.equal(classificarMembro('Abdômen'), 'core')
})

test('não progride se não completou todas as reps', () => {
  const peso = sugerirProximoPeso(80, 8, 10, 'Peito')
  assert.equal(peso, 80)
})

test('membro superior progride 2,5% ao completar todas as reps', () => {
  const peso = sugerirProximoPeso(80, 10, 10, 'Peito')
  assert.equal(peso, 82) // 80 * 1.025 = 82, já múltiplo de 0,5
})

test('membro inferior progride 5% ao completar todas as reps', () => {
  const peso = sugerirProximoPeso(100, 12, 12, 'Quadríceps')
  assert.equal(peso, 105)
})

test('arredonda pro meio quilo mais próximo', () => {
  const peso = sugerirProximoPeso(33, 10, 10, 'Bíceps') // 33 * 1.025 = 33.825 -> 34
  assert.equal(peso, 34)
})

test('core não progride mesmo completando as reps', () => {
  const peso = sugerirProximoPeso(0, 20, 20, 'Abdômen')
  assert.equal(peso, 0)
})
