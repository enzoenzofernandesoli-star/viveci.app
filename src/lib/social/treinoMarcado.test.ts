import test from 'node:test'
import assert from 'node:assert/strict'
import { formatarDataHoraTreino, validarTreinoMarcado } from './treinoMarcado.ts'

const agora = new Date('2026-08-29T12:00:00-03:00')

test('aceita local e horário futuro', () => {
  assert.equal(validarTreinoMarcado({ local: 'Academia Central', dataHora: '2026-08-29T18:30:00-03:00' }, agora), null)
})

test('recusa local vazio e horário passado', () => {
  assert.equal(validarTreinoMarcado({ local: ' ', dataHora: '2026-08-29T18:30:00-03:00' }, agora), 'Informe onde será o treino.')
  assert.equal(validarTreinoMarcado({ local: 'Parque', dataHora: '2026-08-29T10:00:00-03:00' }, agora), 'Escolha um horário futuro.')
})

test('formata o convite em português', () => {
  assert.match(formatarDataHoraTreino('2026-08-29T18:30:00-03:00'), /29 de ago/)
})
