import assert from 'node:assert/strict'
import test from 'node:test'
import { calcularLayoutResumo } from './posicaoResumoCorporal.ts'

test('cantos esquerdos alinham conteúdo à esquerda', () => {
  assert.equal(calcularLayoutResumo('superior-esquerdo').alinhamento, 'left')
  assert.equal(calcularLayoutResumo('inferior-esquerdo').corpoX, 42)
})

test('cantos direitos mantêm o corpo dentro do canvas de 1080px', () => {
  const layout = calcularLayoutResumo('inferior-direito')
  assert.equal(layout.alinhamento, 'right')
  assert.equal(layout.corpoX + 300, 1038)
})

test('centro posiciona corpo e textos no eixo central', () => {
  const layout = calcularLayoutResumo('centro')
  assert.equal(layout.alinhamento, 'center')
  assert.equal(layout.logoX, 540)
  assert.equal(layout.corpoX + 150, 540)
})

test('posição inferior termina o corpo antes da margem do story', () => {
  assert.equal(calcularLayoutResumo('inferior-esquerdo').corpoY + 531, 1821)
})
