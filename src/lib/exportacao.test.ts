import test from 'node:test'
import assert from 'node:assert/strict'
import { montarPacoteExportacao } from './exportacao.ts'

test('exportação é identificável e versionada', () => {
  const pacote = montarPacoteExportacao('u1', { perfil: { nome: 'Enzo' }, posts: [] }, '2026-08-18T00:00:00.000Z')
  assert.equal(pacote.formato, 'viveci-export')
  assert.equal(pacote.versao, 1)
  assert.deepEqual(pacote.posts, [])
})

