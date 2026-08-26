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
  assert.equal(rank.pontosParaProximo, 25)
})

test('média 60 alcança Ouro', () => {
  const rank = calcularRankCorporal(percentuais(60))
  assert.equal(rank.nome, 'Ouro')
  assert.equal(rank.proximoRank, 'Platina')
  assert.equal(rank.progressoNoRank, 0)
})

test('ranks superiores exigem média semanal quase completa', () => {
  assert.equal(calcularRankCorporal(percentuais(89)).nome, 'Diamante')
  assert.equal(calcularRankCorporal(percentuais(90)).nome, 'Ascendente')
  assert.equal(calcularRankCorporal(percentuais(96)).nome, 'Imortal')
  assert.equal(calcularRankCorporal(percentuais(99)).nome, 'Radiante')
})

test('média 100 mantém Radiante como rank máximo', () => {
  const rank = calcularRankCorporal(percentuais(100))
  assert.equal(rank.nome, 'Radiante')
  assert.equal(rank.proximoRank, null)
  assert.equal(rank.progressoNoRank, 100)
})
