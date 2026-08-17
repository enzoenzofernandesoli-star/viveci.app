import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularDNA, interpretarDNA, type SerieParaDNA } from './dnaTreino.ts'

const HOJE = '2026-08-17T12:00:00.000Z'

test('sem nenhuma série, todos os indicadores ficam zerados ou neutros', () => {
  const dna = calcularDNA([], 0, HOJE, 3)
  assert.equal(dna.consistencia, 0)
  assert.equal(dna.volume, 0)
  assert.equal(dna.hipertrofia, 0)
  assert.equal(dna.progressao, 0)
  assert.equal(dna.forca, 50)
  assert.equal(dna.equilibrio, 0)
})

test('consistência bate a meta mensal com 5 dias/semana e treina todo dia útil', () => {
  const dna = calcularDNA([], 21, HOJE, 5)
  assert.equal(dna.consistencia, 98)
})

test('consistência nunca passa de 100', () => {
  const dna = calcularDNA([], 100, HOJE, 3)
  assert.equal(dna.consistencia, 100)
})

test('hipertrofia conta só séries na faixa 8-12 reps', () => {
  const series: SerieParaDNA[] = [
    { exercicio_id: 1, peso_kg: 80, reps: 10, data: '2026-08-15', grupo_muscular: 'Peito' },
    { exercicio_id: 1, peso_kg: 80, reps: 5, data: '2026-08-15', grupo_muscular: 'Peito' },
  ]
  const dna = calcularDNA(series, 1, HOJE, 3)
  assert.equal(dna.hipertrofia, 50)
})

test('progressão detecta PR dentro dos últimos 30 dias', () => {
  const series: SerieParaDNA[] = [
    { exercicio_id: 1, peso_kg: 80, reps: 8, data: '2026-08-01', grupo_muscular: 'Peito' },
    { exercicio_id: 1, peso_kg: 85, reps: 8, data: '2026-08-10', grupo_muscular: 'Peito' },
  ]
  const dna = calcularDNA(series, 2, HOJE, 3)
  assert.equal(dna.progressao, 100)
})

test('força sobe quando o 1RM estimado cresce nos últimos 90 dias', () => {
  const series: SerieParaDNA[] = [
    { exercicio_id: 1, peso_kg: 80, reps: 8, data: '2026-06-01', grupo_muscular: 'Peito' },
    { exercicio_id: 1, peso_kg: 88, reps: 8, data: '2026-08-01', grupo_muscular: 'Peito' },
  ]
  const dna = calcularDNA(series, 2, HOJE, 3)
  assert.ok(dna.forca > 50)
})

test('equilíbrio cai quando um grupo domina o volume', () => {
  const series: SerieParaDNA[] = [
    { exercicio_id: 1, peso_kg: 100, reps: 10, data: '2026-08-15', grupo_muscular: 'Peito' },
    { exercicio_id: 1, peso_kg: 100, reps: 10, data: '2026-08-15', grupo_muscular: 'Peito' },
    { exercicio_id: 2, peso_kg: 5, reps: 10, data: '2026-08-15', grupo_muscular: 'Posterior' },
  ]
  const dna = calcularDNA(series, 1, HOJE, 3)
  assert.ok(dna.equilibrio < 20)
})

test('interpretarDNA sem dados devolve mensagem neutra', () => {
  const dna = calcularDNA([], 0, HOJE, 3)
  const perfil = interpretarDNA(dna)
  assert.match(perfil.descricao, /sem dados/)
})

test('interpretarDNA com consistência alta anexa "consistente" ao rótulo', () => {
  const series: SerieParaDNA[] = [
    { exercicio_id: 1, peso_kg: 80, reps: 10, data: '2026-08-15', grupo_muscular: 'Peito' },
  ]
  const dna = calcularDNA(series, 21, HOJE, 5)
  const perfil = interpretarDNA(dna)
  assert.match(perfil.rotulo, /CONSISTENTE/)
})
