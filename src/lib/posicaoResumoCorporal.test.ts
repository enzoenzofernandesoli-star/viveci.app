import assert from 'node:assert/strict'
import test from 'node:test'
import { calcularLayoutCorpos, calcularLayoutResumo } from './posicaoResumoCorporal.ts'

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

test('frente e costas ficam lado a lado e dentro do story', () => {
  const corpos = calcularLayoutCorpos('inferior-direito', true)
  assert.equal(corpos.length, 2)
  assert.equal(corpos[0].x + corpos[0].largura + 8, corpos[1].x)
  assert.equal(corpos[1].x + corpos[1].largura, 1038)
})

test('somente frente preserva o tamanho original', () => {
  assert.deepEqual(calcularLayoutCorpos('superior-esquerdo', false), [
    { x: 42, y: 354, largura: 300, altura: 531 },
  ])
})
