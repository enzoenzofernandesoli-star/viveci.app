import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizarExerciciosCompartilhados, percentuaisDoTreinoCompartilhado } from './treinoCompartilhado.ts'

test('normaliza snapshot público e ignora exercício desconhecido', () => {
  const resultado = normalizarExerciciosCompartilhados([
    { exercicioId: 1, nome: 'Supino', series: 4, repsMin: 8, repsMax: 10, descansoSeg: 120 },
    { exercicioId: 999, nome: 'Inválido', series: 3 },
  ])
  assert.equal(resultado.length, 1)
  assert.equal(resultado[0].series, 4)
})

test('mapa do treino reflete os grupos dos exercícios compartilhados', () => {
  const percentuais = percentuaisDoTreinoCompartilhado([
    { exercicioId: 1, nome: 'Supino reto', series: 4, repsMin: 8, repsMax: 10, descansoSeg: 90 },
  ])
  assert.equal(percentuais.Peito, 100)
  assert.ok(percentuais.Tríceps > 0)
  assert.equal(percentuais.Quadríceps, 0)
})
