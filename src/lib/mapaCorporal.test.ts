import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  calcularVolumePorGrupo,
  calcularPercentuais,
  detectarDesequilibrios,
  detectarMusculoNegligenciado,
  type RegistroParaMapa,
} from './mapaCorporal.ts'
import { EXERCICIOS } from '../data/exercicios.ts'

// Supino reto com barra: id 1, Peito, composto, secundários Tríceps+Ombros
// Rosca direta com barra: id 29, Bíceps, isolado

test('exercício isolado joga 100% do volume no grupo primário', () => {
  const registros: RegistroParaMapa[] = [{ exercicio_id: 29, peso_kg: 20, reps: 10 }]
  const volumes = calcularVolumePorGrupo(registros, EXERCICIOS)
  assert.equal(volumes['Bíceps'], 200)
  assert.equal(volumes['Peito'], 0)
})

test('exercício composto divide 70/30 entre primário e secundários', () => {
  const registros: RegistroParaMapa[] = [{ exercicio_id: 1, peso_kg: 100, reps: 10 }]
  const volumes = calcularVolumePorGrupo(registros, EXERCICIOS)
  const total = 100 * 10
  assert.equal(volumes['Peito'], total * 0.7)
  // secundários da id 1: Tríceps, Ombros — 30% dividido entre os dois
  assert.equal(volumes['Tríceps'], (total * 0.3) / 2)
  assert.equal(volumes['Ombros'], (total * 0.3) / 2)
})

test('soma várias séries do mesmo grupo', () => {
  const registros: RegistroParaMapa[] = [
    { exercicio_id: 29, peso_kg: 20, reps: 10 },
    { exercicio_id: 29, peso_kg: 20, reps: 8 },
  ]
  const volumes = calcularVolumePorGrupo(registros, EXERCICIOS)
  assert.equal(volumes['Bíceps'], 20 * 10 + 20 * 8)
})

test('percentual do grupo com maior volume é sempre 100', () => {
  const registros: RegistroParaMapa[] = [
    { exercicio_id: 29, peso_kg: 20, reps: 10 }, // Bíceps: 200
    { exercicio_id: 1, peso_kg: 10, reps: 10 }, // Peito: 70
  ]
  const volumes = calcularVolumePorGrupo(registros, EXERCICIOS)
  const percentuais = calcularPercentuais(volumes)
  assert.equal(percentuais['Bíceps'], 100)
})

test('grupo sem nenhum registro fica em 0%', () => {
  const registros: RegistroParaMapa[] = [{ exercicio_id: 29, peso_kg: 20, reps: 10 }]
  const percentuais = calcularPercentuais(calcularVolumePorGrupo(registros, EXERCICIOS))
  assert.equal(percentuais['Panturrilha'], 0)
})

test('sem nenhum registro, todos os percentuais são 0', () => {
  const percentuais = calcularPercentuais(calcularVolumePorGrupo([], EXERCICIOS))
  assert.equal(percentuais['Peito'], 0)
  assert.equal(percentuais['Costas'], 0)
})

test('detecta desequilíbrio quando a diferença passa 25 pontos', () => {
  const percentuais = calcularPercentuais(volumesFixos({ Peito: 100, Costas: 50 }))
  const alertas = detectarDesequilibrios(percentuais)
  assert.equal(alertas.length, 1)
  assert.equal(alertas[0].grupoMaisTreinado, 'Peito')
  assert.equal(alertas[0].grupoMenosTreinado, 'Costas')
})

test('não alerta quando a diferença é 25 pontos ou menos', () => {
  const percentuais = calcularPercentuais(volumesFixos({ Peito: 100, Costas: 75 }))
  const alertas = detectarDesequilibrios(percentuais)
  assert.equal(alertas.length, 0)
})

test('não alerta grupos sem par antagonista definido', () => {
  const percentuais = calcularPercentuais(volumesFixos({ Ombros: 100, Panturrilha: 0 }))
  const alertas = detectarDesequilibrios(percentuais)
  assert.equal(alertas.length, 0)
})

// Voador na máquina: id 6, Peito, isolado — sem contaminar outros grupos.
// Panturrilha em pé: id 52, Panturrilha, isolado.

test('detecta músculo negligenciado quando a diferença passa 30 pontos', () => {
  const registros: RegistroParaMapa[] = [
    { exercicio_id: 6, peso_kg: 100, reps: 1 },
    { exercicio_id: 52, peso_kg: 40, reps: 1 },
  ]
  const percentuais = calcularPercentuais(calcularVolumePorGrupo(registros, EXERCICIOS))
  const alerta = detectarMusculoNegligenciado(percentuais)
  assert.equal(alerta?.grupo, 'Panturrilha')
  assert.equal(alerta?.grupoReferencia, 'Peito')
})

test('não alerta músculo negligenciado com diferença de 30 pontos ou menos', () => {
  const registros: RegistroParaMapa[] = [
    { exercicio_id: 6, peso_kg: 100, reps: 1 },
    { exercicio_id: 52, peso_kg: 70, reps: 1 },
  ]
  const percentuais = calcularPercentuais(calcularVolumePorGrupo(registros, EXERCICIOS))
  assert.equal(detectarMusculoNegligenciado(percentuais), null)
})

test('não alerta músculo negligenciado com menos de 2 grupos treinados', () => {
  const registros: RegistroParaMapa[] = [{ exercicio_id: 6, peso_kg: 100, reps: 1 }]
  const percentuais = calcularPercentuais(calcularVolumePorGrupo(registros, EXERCICIOS))
  assert.equal(detectarMusculoNegligenciado(percentuais), null)
})

function volumesFixos(parcial: Partial<Record<string, number>>) {
  const registros: RegistroParaMapa[] = []
  const idPorGrupo: Record<string, number> = {
    Peito: 1, // composto, mas usamos só pra comparação relativa
    Costas: 14, // Puxada frontal na polia — composto
    Ombros: 22,
    Panturrilha: 52, // Panturrilha em pé — isolado, sem secundário
  }
  for (const [grupo, volume] of Object.entries(parcial)) {
    const id = idPorGrupo[grupo]
    if (volume && id) registros.push({ exercicio_id: id, peso_kg: volume!, reps: 1 })
  }
  return calcularVolumePorGrupo(registros, EXERCICIOS)
}
