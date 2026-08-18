import test from 'node:test'
import assert from 'node:assert/strict'
import { LIMITE_COMENTARIO, validarTextoSocial } from './limites.ts'

test('normaliza texto social', () => assert.equal(validarTextoSocial('  ótimo treino  ', 50, 'Comentário'), 'ótimo treino'))
test('recusa texto acima do limite', () => assert.throws(() => validarTextoSocial('a'.repeat(LIMITE_COMENTARIO + 1), LIMITE_COMENTARIO, 'Comentário'), /500 caracteres/))

