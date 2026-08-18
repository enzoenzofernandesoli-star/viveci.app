import test from 'node:test'
import assert from 'node:assert/strict'
import { montarPacoteExportacao } from './exportacao.ts'

test('exportação é identificável e versionada', () => {
  const pacote = montarPacoteExportacao('u1', { perfil: { nome: 'Enzo' }, posts: [] }, '2026-08-18T00:00:00.000Z')
  assert.equal(pacote.formato, 'viveci-export')
  assert.equal(pacote.versao, 1)
  assert.deepEqual(pacote.posts, [])
})

test('exportação remove tokens, senhas e segredos mesmo quando aninhados', () => {
  const pacote = montarPacoteExportacao('u1', {
    perfil: { nome: 'Enzo', access_token: 'não pode sair', preferencias: { senha: 'nem esta' } },
    refresh_token: 'nem este',
  }, '2026-08-18T00:00:00.000Z')

  assert.deepEqual(pacote.perfil, { nome: 'Enzo', preferencias: {} })
  assert.equal('refresh_token' in pacote, false)
})
