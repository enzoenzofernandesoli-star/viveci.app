import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularMacrosPorQuantidade } from './alimentos.ts'
import type { Alimento } from '../data/alimentos.ts'

const FRANGO: Alimento = {
  id: 5,
  nome: 'Peito de frango grelhado',
  kcal_100: 159,
  prot_100: 32.0,
  carb_100: 0.0,
  gord_100: 2.5,
  categoria: 'Proteína',
}

test('100g devolve exatamente os valores por 100g', () => {
  const r = calcularMacrosPorQuantidade(FRANGO, 100)
  assert.equal(r.kcal, 159)
  assert.equal(r.prot_g, 32)
})

test('200g dobra os valores', () => {
  const r = calcularMacrosPorQuantidade(FRANGO, 200)
  assert.equal(r.kcal, 318)
  assert.equal(r.prot_g, 64)
})

test('150g calcula proporcionalmente', () => {
  const r = calcularMacrosPorQuantidade(FRANGO, 150)
  assert.equal(r.kcal, 239) // 159 * 1.5 = 238.5 -> arredonda pra 239
  assert.equal(r.prot_g, 48)
})

test('0g devolve tudo zero', () => {
  const r = calcularMacrosPorQuantidade(FRANGO, 0)
  assert.deepEqual(r, { kcal: 0, prot_g: 0, carb_g: 0, gord_g: 0 })
})
