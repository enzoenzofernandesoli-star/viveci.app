import test from 'node:test'
import assert from 'node:assert/strict'
import { TAMANHO_MAX_AVATAR, TAMANHO_MAX_MIDIA_CHAT, validarImagem, validarMidiaChat } from './uploadSeguro.ts'

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

test('aceita imagem e áudio permitidos no chat', () => {
  assert.deepEqual(validarMidiaChat({ name: 'foto.webp', type: 'image/webp', size: 1024 }), { tipo: 'imagem', extensao: 'webp' })
  assert.deepEqual(validarMidiaChat({ name: 'voz.webm', type: 'audio/webm', size: 1024 }), { tipo: 'audio', extensao: 'webm' })
})

test('recusa áudio desconhecido ou acima do limite', () => {
  assert.throws(() => validarMidiaChat({ name: 'voz.aac', type: 'audio/aac', size: 1024 }), /MP3/)
  assert.throws(() => validarMidiaChat({ name: 'voz.mp3', type: 'audio/mpeg', size: TAMANHO_MAX_MIDIA_CHAT + 1 }), /15 MB/)
})
