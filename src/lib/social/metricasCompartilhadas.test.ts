import test from 'node:test'
import assert from 'node:assert/strict'
import { filtrarMetricasCompartilhadas } from './metricasCompartilhadas.ts'

const metricas = { duracaoSeg: 2520, numeroSeries: 14, volumeTotalKg: 8420 }

test('compartilha somente duração quando séries e volume estão ocultos', () => {
  assert.deepEqual(filtrarMetricasCompartilhadas({ ...metricas, mostrarDuracao: true, mostrarSeries: false, mostrarVolume: false }), {
    duracaoSeg: 2520,
    numeroSeries: null,
    volumeTotalKg: null,
  })
})

test('remove todas as métricas quando nenhum campo foi autorizado', () => {
  assert.deepEqual(filtrarMetricasCompartilhadas({ ...metricas, mostrarDuracao: false, mostrarSeries: false, mostrarVolume: false }), {
    duracaoSeg: null,
    numeroSeries: null,
    volumeTotalKg: null,
  })
})

test('mantém todas as métricas explicitamente autorizadas', () => {
  assert.deepEqual(filtrarMetricasCompartilhadas({ ...metricas, mostrarDuracao: true, mostrarSeries: true, mostrarVolume: true }), metricas)
})
