import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularDesafioInicial } from './desafioInicial.ts'

test('nenhuma tarefa concluída fica em 0%', () => {
  const r = calcularDesafioInicial({
    onboardingCompleto: false,
    temRotinaCriada: false,
    temTreinoConcluido: false,
    temPost: false,
  })
  assert.equal(r.percentual, 0)
})

test('uma de quatro tarefas concluída fica em 25%', () => {
  const r = calcularDesafioInicial({
    onboardingCompleto: true,
    temRotinaCriada: false,
    temTreinoConcluido: false,
    temPost: false,
  })
  assert.equal(r.percentual, 25)
})

test('todas as tarefas concluídas ficam em 100%', () => {
  const r = calcularDesafioInicial({
    onboardingCompleto: true,
    temRotinaCriada: true,
    temTreinoConcluido: true,
    temPost: true,
  })
  assert.equal(r.percentual, 100)
})

test('cada tarefa reflete a entrada correspondente', () => {
  const r = calcularDesafioInicial({
    onboardingCompleto: true,
    temRotinaCriada: false,
    temTreinoConcluido: true,
    temPost: false,
  })
  const porChave = Object.fromEntries(r.tarefas.map((t) => [t.chave, t.concluida]))
  assert.equal(porChave.onboarding, true)
  assert.equal(porChave.rotina, false)
  assert.equal(porChave.treino, true)
  assert.equal(porChave.post, false)
})
