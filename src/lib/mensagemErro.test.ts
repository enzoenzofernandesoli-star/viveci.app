import test from 'node:test'
import assert from 'node:assert/strict'
import { mensagemErro } from './mensagemErro.ts'

test('traduz credenciais inválidas', () => {
  assert.equal(mensagemErro(new Error('Invalid login credentials'), 'Falhou'), 'E-mail ou senha incorretos.')
})

test('traduz e-mail não confirmado', () => {
  assert.equal(mensagemErro(new Error('Email not confirmed'), 'Falhou'), 'Confirme seu e-mail antes de entrar.')
})

test('traduz falha de conexão', () => {
  assert.equal(mensagemErro(new TypeError('Failed to fetch'), 'Falhou'), 'Sem conexão com o VIVECI. Verifique sua internet e tente novamente.')
})

test('não expõe erro técnico desconhecido', () => {
  assert.equal(mensagemErro(new Error('PGRST204 internal detail'), 'Tente novamente.'), 'Tente novamente.')
})
