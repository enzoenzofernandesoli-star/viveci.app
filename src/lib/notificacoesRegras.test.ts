import test from 'node:test'
import assert from 'node:assert/strict'
import { rotaPushSegura } from './notificacoesRegras.ts'

test('aceita somente rotas internas conhecidas', () => {
  assert.equal(rotaPushSegura('/social/mensagem/123'), '/social/mensagem/123')
  assert.equal(rotaPushSegura('/perfil'), '/perfil')
})

test('recusa URL externa e rota desconhecida', () => {
  assert.equal(rotaPushSegura('https://site-malicioso.test'), null)
  assert.equal(rotaPushSegura('//site-malicioso.test'), null)
  assert.equal(rotaPushSegura('/admin'), null)
})
