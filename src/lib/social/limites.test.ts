import test from 'node:test'
import assert from 'node:assert/strict'
import { LIMITE_COMENTARIO, normalizarBuscaPessoas, validarTextoSocial } from './limites.ts'

test('normaliza texto social', () => assert.equal(validarTextoSocial('  ótimo treino  ', 50, 'Comentário'), 'ótimo treino'))
test('recusa texto acima do limite', () => assert.throws(() => validarTextoSocial('a'.repeat(LIMITE_COMENTARIO + 1), LIMITE_COMENTARIO, 'Comentário'), /500 caracteres/))
test('normaliza busca de pessoas e remove curingas', () => assert.equal(normalizarBuscaPessoas('  Ana%__  Silva  '), 'Ana Silva'))
test('limita busca de pessoas a 60 caracteres', () => assert.equal(normalizarBuscaPessoas('a'.repeat(80)).length, 60))
