import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizarDescricaoGrupo, normalizarNomeGrupo, validarSenhaGrupo } from './grupoRegras.ts'

test('normaliza nome e espaços do grupo', () => {
  assert.equal(normalizarNomeGrupo('  Equipe   VIVECI  '), 'Equipe VIVECI')
})

test('limita descrição do grupo', () => {
  assert.equal(normalizarDescricaoGrupo('a'.repeat(400)).length, 280)
})

test('grupo privado exige senha segura', () => {
  assert.throws(() => validarSenhaGrupo('', true))
  assert.throws(() => validarSenhaGrupo('12345', true))
  assert.equal(validarSenhaGrupo('viveci123', true), 'viveci123')
})

test('grupo aberto pode ficar sem senha', () => {
  assert.equal(validarSenhaGrupo('', false), null)
})
