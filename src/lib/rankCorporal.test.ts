import assert from 'node:assert/strict'
import test from 'node:test'
import { GRUPOS_MUSCULARES, type PercentualPorGrupo } from './mapaCorporal.ts'
import { calcularMediaCorporal, calcularRankCorporal } from './rankCorporal.ts'

function percentuais(valor: number): PercentualPorGrupo {
  return Object.fromEntries(GRUPOS_MUSCULARES.map((grupo) => [grupo, valor])) as PercentualPorGrupo
}

test('média corporal considera os dez grupos musculares', () => {
  const dados = percentuais(50)
  dados.Peito = 100
  assert.equal(calcularMediaCorporal(dados), 55)
})

test('sem estímulos começa no Ferro', () => {
  const rank = calcularRankCorporal(percentuais(0))
  assert.equal(rank.nome, 'Ferro')
  assert.equal(rank.proximoRank, 'Bronze')
  assert.equal(rank.pontosParaProximo, 15)
})

test('média 60 alcança Platina', () => {
  const rank = calcularRankCorporal(percentuais(60))
  assert.equal(rank.nome, 'Platina')
  assert.equal(rank.proximoRank, 'Diamante')
  assert.equal(rank.progressoNoRank, 0)
})

test('média 100 mantém Radiante como rank máximo', () => {
  const rank = calcularRankCorporal(percentuais(100))
  assert.equal(rank.nome, 'Radiante')
  assert.equal(rank.proximoRank, null)
  assert.equal(rank.progressoNoRank, 100)
})
