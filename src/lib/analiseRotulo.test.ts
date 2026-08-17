import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularConsumoPorPorcao, explicarRotulo } from './analiseRotulo.ts'
import type { RotuloNutricional } from './services/labelScannerService.ts'

const ROTULO: RotuloNutricional = {
  produto: 'Produto teste',
  porcaoG: 30,
  kcal: 120,
  carb_g: 14,
  acucares_g: 6,
  proteina_g: 8,
  gordura_g: 3,
  gordura_saturada_g: 1,
  fibra_g: 2,
  sodio_mg: 45,
}

test('explicarRotulo classifica proteína boa, açúcar moderado, sódio baixo, calorias leve', () => {
  const e = explicarRotulo(ROTULO)
  assert.equal(e.proteina, 'Boa quantidade para um lanche.')
  assert.equal(e.acucar, 'Moderado.')
  assert.equal(e.sodio, 'Baixo.')
  assert.equal(e.calorias, 'Compatível com uma refeição leve.')
})

test('explicarRotulo classifica sódio alto acima de 400mg', () => {
  const e = explicarRotulo({ ...ROTULO, sodio_mg: 500 })
  assert.equal(e.sodio, 'Alto.')
})

test('calcularConsumoPorPorcao: exatamente 1 porção não gera alerta', () => {
  const c = calcularConsumoPorPorcao(ROTULO, 30)
  assert.equal(c.porcoesConsumidas, 1)
  assert.equal(c.kcalTotal, 120)
  assert.equal(c.alertaMultiplasPorcoes, false)
})

test('calcularConsumoPorPorcao: 90g de uma porção de 30g = 3 porções, com alerta', () => {
  const c = calcularConsumoPorPorcao(ROTULO, 90)
  assert.equal(c.porcoesConsumidas, 3)
  assert.equal(c.kcalTotal, 360)
  assert.equal(c.alertaMultiplasPorcoes, true)
})
