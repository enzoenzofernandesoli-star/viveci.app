import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  semanaBloqueada,
  exercicioBloqueado,
  recalculoAutomaticoBloqueado,
  diaDoDiarioBloqueado,
} from './planos.ts'

test('free só libera a semana 1', () => {
  assert.equal(semanaBloqueada('free', 1), false)
  assert.equal(semanaBloqueada('free', 2), true)
  assert.equal(semanaBloqueada('free', 12), true)
})

test('básico e premium liberam todas as semanas', () => {
  for (const semana of [1, 5, 12]) {
    assert.equal(semanaBloqueada('basico', semana), false)
    assert.equal(semanaBloqueada('premium', semana), false)
  }
})

test('free só libera os primeiros 20 exercícios', () => {
  assert.equal(exercicioBloqueado('free', 0), false)
  assert.equal(exercicioBloqueado('free', 19), false)
  assert.equal(exercicioBloqueado('free', 20), true)
})

test('básico e premium liberam a biblioteca inteira', () => {
  assert.equal(exercicioBloqueado('basico', 58), false)
  assert.equal(exercicioBloqueado('premium', 58), false)
})

test('só o premium tem recálculo automático de meta', () => {
  assert.equal(recalculoAutomaticoBloqueado('free'), true)
  assert.equal(recalculoAutomaticoBloqueado('basico'), true)
  assert.equal(recalculoAutomaticoBloqueado('premium'), false)
})

test('free e básico só veem 7 dias de histórico do diário', () => {
  assert.equal(diaDoDiarioBloqueado('free', 8), true)
  assert.equal(diaDoDiarioBloqueado('basico', 8), true)
  assert.equal(diaDoDiarioBloqueado('premium', 8), false)
})

test('dentro de 7 dias, ninguém é bloqueado', () => {
  assert.equal(diaDoDiarioBloqueado('free', 7), false)
  assert.equal(diaDoDiarioBloqueado('basico', 7), false)
})
