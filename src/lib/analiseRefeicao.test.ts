import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aplicarAjusteQuantidade, avaliarRefeicao, somarItens } from './analiseRefeicao.ts'
import type { ItemIdentificado } from './services/foodScannerService.ts'

const ARROZ: ItemIdentificado = {
  nome: 'Arroz branco',
  quantidadeEstimadaG: 100,
  kcal: 130,
  prot_g: 2.7,
  carb_g: 28,
  gord_g: 0.3,
  fibra_g: 0.4,
}

test('ajuste "medio" não muda nada', () => {
  const r = aplicarAjusteQuantidade(ARROZ, 'medio')
  assert.equal(r.kcal, 130)
  assert.equal(r.quantidadeEstimadaG, 100)
})

test('ajuste "muito" aumenta 50%', () => {
  const r = aplicarAjusteQuantidade(ARROZ, 'muito')
  assert.equal(r.quantidadeEstimadaG, 150)
  assert.equal(r.kcal, 195)
})

test('ajuste "pouco" reduz pra 60%', () => {
  const r = aplicarAjusteQuantidade(ARROZ, 'pouco')
  assert.equal(r.quantidadeEstimadaG, 60)
  assert.equal(r.kcal, 78)
})

test('somarItens soma kcal e macros de todos os itens', () => {
  const totais = somarItens([ARROZ, ARROZ])
  assert.equal(totais.kcal, 260)
  assert.equal(totais.carb_g, 56)
})

test('avaliarRefeicao classifica proteína boa e fibra baixa', () => {
  const av = avaliarRefeicao({ kcal: 500, prot_g: 30, carb_g: 40, gord_g: 10, fibra_g: 1 })
  assert.equal(av.proteina, 'boa')
  assert.equal(av.fibras, 'baixa')
  assert.ok(av.sugestoes.some((s) => s.includes('fibras')))
})

test('avaliarRefeicao não sugere nada quando proteína e fibra estão boas', () => {
  const av = avaliarRefeicao({ kcal: 500, prot_g: 30, carb_g: 40, gord_g: 10, fibra_g: 8 })
  assert.equal(av.sugestoes.length, 0)
})

test('carboidrato é só descritivo: baixo/moderado/alto', () => {
  assert.equal(avaliarRefeicao({ kcal: 0, prot_g: 0, carb_g: 10, gord_g: 0, fibra_g: 0 }).carboidratos, 'baixo')
  assert.equal(avaliarRefeicao({ kcal: 0, prot_g: 0, carb_g: 40, gord_g: 0, fibra_g: 0 }).carboidratos, 'moderado')
  assert.equal(avaliarRefeicao({ kcal: 0, prot_g: 0, carb_g: 90, gord_g: 0, fibra_g: 0 }).carboidratos, 'alto')
})
