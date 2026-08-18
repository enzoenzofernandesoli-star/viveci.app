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

test('traduz bloqueio de autorização sem expor RLS', () => {
  assert.equal(mensagemErro(new Error('new row violates row-level security policy'), 'Falhou'), 'Sua sessão não permite esta ação. Entre novamente e tente de novo.')
})

test('traduz registro duplicado', () => {
  assert.equal(mensagemErro(new Error('duplicate key value violates unique constraint 23505'), 'Falhou'), 'Este registro já foi salvo. Atualize a tela antes de tentar novamente.')
})

test('traduz violação de validação do banco', () => {
  assert.equal(mensagemErro(new Error('violates check constraint 23514'), 'Falhou'), 'Os dados informados não são válidos. Revise os campos e tente novamente.')
})

test('traduz timeout', () => {
  assert.equal(mensagemErro(new Error('Request timed out'), 'Falhou'), 'A operação demorou demais. Verifique sua conexão e tente novamente.')
})
