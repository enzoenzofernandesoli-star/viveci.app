import assert from 'node:assert/strict'
import test from 'node:test'
import { validarNovaSenha, validarNovoEmail } from './senha.ts'

test('recusa senha com menos de oito caracteres', () => {
  assert.equal(validarNovaSenha('1234567', '1234567'), 'A senha precisa ter pelo menos 8 caracteres.')
})

test('recusa confirmação diferente', () => {
  assert.equal(validarNovaSenha('senha-segura', 'outra-senha'), 'As senhas não coincidem.')
})

test('aceita senha válida confirmada', () => {
  assert.equal(validarNovaSenha('senha-segura', 'senha-segura'), null)
})

test('recusa novo e-mail inválido', () => {
  assert.equal(validarNovoEmail('atual@viveci.app', 'email-invalido'), 'Informe um e-mail válido.')
})

test('recusa novo e-mail igual ao atual', () => {
  assert.equal(validarNovoEmail('atual@viveci.app', 'ATUAL@viveci.app'), 'O novo e-mail precisa ser diferente do atual.')
})

test('aceita novo e-mail válido e diferente', () => {
  assert.equal(validarNovoEmail('atual@viveci.app', 'novo@viveci.app'), null)
})
