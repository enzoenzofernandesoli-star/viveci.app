import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularMacrosPorQuantidade, converterPorcaoEmGramas, nomePorcao, obterPorcoesAlimento } from './alimentos.ts'
import type { Alimento, PorcaoAlimento } from '../data/alimentos.ts'
import { ALIMENTOS } from '../data/alimentos.ts'

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

test('ovo usa unidade de 50g como medida principal', () => {
  const ovo: Alimento = { ...FRANGO, id: 12, nome: 'Ovo cozido' }
  const porcao = obterPorcoesAlimento(ovo)[0]
  assert.equal(porcao.singular, 'unidade')
  assert.equal(converterPorcaoEmGramas(porcao, 3), 150)
})

test('arroz permite colher, xícara e gramas', () => {
  const arroz: Alimento = { ...FRANGO, id: 1, nome: 'Arroz branco cozido', categoria: 'Carboidrato' }
  assert.deepEqual(obterPorcoesAlimento(arroz).map((porcao) => porcao.id), ['colher', 'xicara', 'gramas'])
})

test('nome da medida acompanha singular e plural', () => {
  const porcao: PorcaoAlimento = { id: 'fatia', singular: 'fatia', plural: 'fatias', gramas: 25 }
  assert.equal(nomePorcao(porcao, 1), 'fatia')
  assert.equal(nomePorcao(porcao, 2), 'fatias')
})

test('quantidade inválida não gera peso negativo', () => {
  const porcao: PorcaoAlimento = { id: 'unidade', singular: 'unidade', plural: 'unidades', gramas: 50 }
  assert.equal(converterPorcaoEmGramas(porcao, -2), 0)
})

test('catálogo ampliado possui 200 alimentos sem IDs repetidos', () => {
  assert.equal(ALIMENTOS.length, 200)
  assert.equal(new Set(ALIMENTOS.map((alimento) => alimento.id)).size, 200)
})

test('catálogo contém variações de ovos e pães', () => {
  const nomes = ALIMENTOS.map((alimento) => alimento.nome)
  assert.ok(nomes.includes('Ovo frito'))
  assert.ok(nomes.includes('Ovo pochê'))
  assert.ok(nomes.includes('Omelete com queijo'))
  assert.ok(nomes.includes('Pão australiano'))
  assert.ok(nomes.includes('Pão de centeio'))
  assert.ok(nomes.includes('Pão de forma sem glúten'))
})
