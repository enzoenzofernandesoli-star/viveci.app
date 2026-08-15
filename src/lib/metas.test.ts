import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularMetas } from './metas.ts'
import type { Perfil } from './perfil.ts'

const base: Perfil = {
  nome: 'Teste',
  sexo: 'masculino',
  idade: 28,
  altura_cm: 178,
  peso_kg: 75.2,
  dias_semana: 5,
  objetivo: 'ganhar_massa',
}

test('caso de referência: homem 28a 178cm 75,2kg 5x ganhar massa', () => {
  const m = calcularMetas(base)
  assert.equal(m.tmb, 1729.5)
  assert.equal(m.get, 2983)
  assert.equal(m.meta_kcal, 3430)
  assert.equal(m.meta_prot_g, 145)
  assert.equal(m.meta_carb_g, 500)
  assert.equal(m.meta_gord_g, 95)
  assert.equal(m.meta_limitada, false)
})

test('piso de 1.200 kcal para mulher leve querendo emagrecer', () => {
  const m = calcularMetas({
    ...base,
    sexo: 'feminino',
    idade: 30,
    altura_cm: 155,
    peso_kg: 45,
    dias_semana: 0,
    objetivo: 'emagrecer',
  })
  assert.ok(m.meta_kcal >= 1200, `meta ficou em ${m.meta_kcal}`)
  assert.equal(m.meta_limitada, true)
})

test('piso de 1.500 kcal para homem leve querendo emagrecer', () => {
  const m = calcularMetas({
    ...base,
    idade: 40,
    altura_cm: 165,
    peso_kg: 55,
    dias_semana: 0,
    objetivo: 'emagrecer',
  })
  assert.ok(m.meta_kcal >= 1500, `meta ficou em ${m.meta_kcal}`)
})

test('meta nunca fica abaixo de TMB x 1,1', () => {
  const m = calcularMetas({ ...base, objetivo: 'emagrecer', dias_semana: 0 })
  assert.ok(m.meta_kcal >= m.tmb * 1.1)
})

test('objetivos diferentes geram metas diferentes', () => {
  const kcal = (['emagrecer', 'definir', 'condicionamento', 'forca', 'ganhar_massa'] as const)
    .map((objetivo) => calcularMetas({ ...base, objetivo }).meta_kcal)
  assert.equal(new Set(kcal).size, 5)
})

test('gordura respeita o piso de 0,8 g/kg', () => {
  const m = calcularMetas({ ...base, objetivo: 'emagrecer' })
  assert.ok(m.meta_gord_g >= Math.round((base.peso_kg * 0.8) / 5) * 5 - 5)
})

test('soma dos macros bate com a meta calórica dentro de 5%', () => {
  for (const dias of [0, 2, 3, 5, 6]) {
    const m = calcularMetas({ ...base, dias_semana: dias })
    const somaKcal = m.meta_prot_g * 4 + m.meta_carb_g * 4 + m.meta_gord_g * 9
    const erro = Math.abs(somaKcal - m.meta_kcal) / m.meta_kcal
    assert.ok(erro < 0.05, `${dias} dias: erro de ${(erro * 100).toFixed(1)}%`)
  }
})
