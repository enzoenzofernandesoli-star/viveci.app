import test from 'node:test'
import assert from 'node:assert/strict'
import { arquivoCategoriaTreino, classificarRotina } from './categoriaTreino.ts'

test('classifica peito, ombros e tríceps como push', () => {
  assert.equal(classificarRotina([
    { grupo_muscular: 'Peito', grupos_secundarios: ['Tríceps', 'Ombros'] },
    { grupo_muscular: 'Ombros', grupos_secundarios: ['Tríceps'] },
  ]), 'push')
})

test('classifica costas e bíceps como pull', () => {
  assert.equal(classificarRotina([
    { grupo_muscular: 'Costas', grupos_secundarios: ['Bíceps'] },
    { grupo_muscular: 'Bíceps' },
  ]), 'pull')
})

test('classifica membros inferiores como legs', () => {
  assert.equal(classificarRotina([
    { grupo_muscular: 'Quadríceps', grupos_secundarios: ['Glúteos'] },
    { grupo_muscular: 'Posterior', grupos_secundarios: ['Glúteos'] },
  ]), 'legs')
})

test('classifica distribuição ampla como full body', () => {
  assert.equal(classificarRotina([
    { grupo_muscular: 'Peito' },
    { grupo_muscular: 'Costas' },
    { grupo_muscular: 'Quadríceps' },
  ]), 'fullbody')
})

test('empate ambíguo usa full body', () => {
  assert.equal(classificarRotina([{ grupo_muscular: 'Peito' }, { grupo_muscular: 'Costas' }]), 'fullbody')
})

test('rotina vazia não recebe categoria', () => {
  assert.equal(classificarRotina([]), null)
})

test('mapeia Push para a fotografia oficial', () => assert.equal(arquivoCategoriaTreino('push'), 'push.webp'))
test('mapeia Pull para a fotografia oficial', () => assert.equal(arquivoCategoriaTreino('pull'), 'pull.webp'))
test('mapeia Legs para a fotografia oficial', () => assert.equal(arquivoCategoriaTreino('legs'), 'legs.webp'))
test('mapeia Full Body para a fotografia oficial', () => assert.equal(arquivoCategoriaTreino('fullbody'), 'fullbody.webp'))
test('mapeia Cardio para a fotografia oficial', () => assert.equal(arquivoCategoriaTreino('cardio'), 'cardio.webp'))
test('categoria desconhecida preserva o fallback', () => assert.equal(arquivoCategoriaTreino('desconhecida'), null))
