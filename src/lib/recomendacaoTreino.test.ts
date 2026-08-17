import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recomendarTreinoHoje, type RotinaParaRecomendacao } from './recomendacaoTreino.ts'
import { GRUPOS_MUSCULARES, type PercentualPorGrupo } from './mapaCorporal.ts'

const HOJE = '2026-08-17T12:00:00.000Z'

function percentuaisZerados(parcial: Partial<PercentualPorGrupo> = {}): PercentualPorGrupo {
  const base = {} as PercentualPorGrupo
  for (const g of GRUPOS_MUSCULARES) base[g] = 0
  return { ...base, ...parcial }
}

test('sem rotinas, não recomenda nada', () => {
  assert.equal(recomendarTreinoHoje([], {}, percentuaisZerados(), HOJE), null)
})

test('prioriza rotina nunca treinada', () => {
  const rotinas: RotinaParaRecomendacao[] = [
    { id: 'a', nome: 'Treino A', gruposMusculares: ['Peito'] },
    { id: 'b', nome: 'Treino B', gruposMusculares: ['Costas'] },
  ]
  const ultimo = { a: '2026-08-16T12:00:00.000Z', b: null }
  const r = recomendarTreinoHoje(rotinas, ultimo, percentuaisZerados(), HOJE)
  assert.equal(r?.rotinaId, 'b')
})

test('prioriza rotina com mais dias sem estímulo', () => {
  const rotinas: RotinaParaRecomendacao[] = [
    { id: 'a', nome: 'Treino A', gruposMusculares: ['Peito'] },
    { id: 'b', nome: 'Treino B', gruposMusculares: ['Costas'] },
  ]
  const ultimo = { a: '2026-08-16T12:00:00.000Z', b: '2026-08-10T12:00:00.000Z' }
  const r = recomendarTreinoHoje(rotinas, ultimo, percentuaisZerados(), HOJE)
  assert.equal(r?.rotinaId, 'b')
  assert.match(r!.motivos[0], /dias desde o último estímulo/)
})

test('com uma única rotina, recomenda mesmo já treinada hoje', () => {
  const rotinas: RotinaParaRecomendacao[] = [{ id: 'a', nome: 'Treino A', gruposMusculares: ['Peito'] }]
  const ultimo = { a: HOJE }
  const r = recomendarTreinoHoje(rotinas, ultimo, percentuaisZerados(), HOJE)
  assert.equal(r?.rotinaId, 'a')
})

test('não recomenda de novo rotina já treinada hoje quando existe outra opção', () => {
  const rotinas: RotinaParaRecomendacao[] = [
    { id: 'a', nome: 'Treino A', gruposMusculares: ['Peito'] },
    { id: 'b', nome: 'Treino B', gruposMusculares: ['Costas'] },
  ]
  const ultimo = { a: HOJE, b: '2026-08-10T12:00:00.000Z' }
  const r = recomendarTreinoHoje(rotinas, ultimo, percentuaisZerados(), HOJE)
  assert.equal(r?.rotinaId, 'b')
})

test('inclui aviso de volume baixo quando os grupos estão abaixo de 50%', () => {
  const rotinas: RotinaParaRecomendacao[] = [{ id: 'a', nome: 'Treino A', gruposMusculares: ['Posterior'] }]
  const ultimo = { a: '2026-08-10T12:00:00.000Z' }
  const percentuais = percentuaisZerados({ Posterior: 30 })
  const r = recomendarTreinoHoje(rotinas, ultimo, percentuais, HOJE)
  assert.ok(r!.motivos.some((m) => m.includes('abaixo da média')))
})
