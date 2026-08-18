import test from 'node:test'
import assert from 'node:assert/strict'
import { TAMANHO_MAX_AVATAR, validarImagem } from './uploadSeguro.ts'

test('aceita JPG válido', () => {
  assert.deepEqual(validarImagem({ name: 'foto.jpeg', type: 'image/jpeg', size: 1024 }, TAMANHO_MAX_AVATAR), { extensao: 'jpg' })
})

test('recusa SVG mesmo sendo imagem', () => {
  assert.throws(() => validarImagem({ name: 'foto.svg', type: 'image/svg+xml', size: 1024 }, TAMANHO_MAX_AVATAR), /JPG, PNG ou WebP/)
})

test('recusa imagem maior que o limite', () => {
  assert.throws(() => validarImagem({ name: 'foto.png', type: 'image/png', size: TAMANHO_MAX_AVATAR + 1 }, TAMANHO_MAX_AVATAR), /no máximo 5 MB/)
})

test('recusa extensão incompatível com MIME', () => {
  assert.throws(() => validarImagem({ name: 'foto.png', type: 'image/jpeg', size: 1024 }, TAMANHO_MAX_AVATAR), /não corresponde/)
})

