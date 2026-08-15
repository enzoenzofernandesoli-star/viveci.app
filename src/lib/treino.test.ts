import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gerarPlanoTreino, type EntradaTreino } from './treino.ts'
import { EXERCICIOS } from '../data/exercicios.ts'

const BASE: EntradaTreino = {
  nivel: 'intermediario',
  objetivo: 'ganhar_massa',
  biotipo: 'mesomorfo',
  local_treino: 'academia',
  dias_semana: 4,
  tempo_sessao_min: 60,
}

test('função é determinística: mesmo perfil, mesmo plano', () => {
  const a = gerarPlanoTreino(BASE, EXERCICIOS)
  const b = gerarPlanoTreino(BASE, EXERCICIOS)
  assert.deepEqual(a, b)
})

test('gera 12 semanas', () => {
  const plano = gerarPlanoTreino(BASE, EXERCICIOS)
  assert.equal(plano.semanas.length, 12)
})

test('divisão por frequência: 2 dias vira Full Body A/B', () => {
  const plano = gerarPlanoTreino({ ...BASE, dias_semana: 2 }, EXERCICIOS)
  const nomes = plano.semanas[0].sessoes.map((s) => s.nome_sessao)
  assert.deepEqual(nomes, ['Full Body A', 'Full Body B'])
})

test('divisão por frequência: 3 dias vira Push/Pull/Legs', () => {
  const plano = gerarPlanoTreino({ ...BASE, dias_semana: 3 }, EXERCICIOS)
  const nomes = plano.semanas[0].sessoes.map((s) => s.nome_sessao)
  assert.deepEqual(nomes, ['Push', 'Pull', 'Legs'])
})

test('divisão por frequência: 6 dias vira PPL x2', () => {
  const plano = gerarPlanoTreino({ ...BASE, dias_semana: 6 }, EXERCICIOS)
  const nomes = plano.semanas[0].sessoes.map((s) => s.nome_sessao)
  assert.deepEqual(nomes, ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'])
})

test('nunca dois treinos do mesmo grupo em dias consecutivos', () => {
  // 1 e 2 dias são full body por definição: todo dia treina (quase) tudo, a regra não se aplica.
  for (const dias of [3, 4, 5, 6]) {
    const plano = gerarPlanoTreino({ ...BASE, dias_semana: dias }, EXERCICIOS)
    const sessoes = plano.semanas[0].sessoes
    for (let i = 1; i < sessoes.length; i++) {
      const anterior = new Set(sessoes[i - 1].grupos)
      const atual = sessoes[i].grupos
      const repetiu = atual.some((g) => anterior.has(g))
      assert.equal(repetiu, false, `dia ${i} repete grupo do dia ${i - 1} na divisão de ${dias}x`)
    }
  }
})

test('volume por nível: iniciante tem menos exercícios e mais descanso curto que avançado', () => {
  // tempo_sessao_min baixo pra não disparar o ajuste de séries por tempo, que mascararia o valor base do nível.
  const iniciante = gerarPlanoTreino({ ...BASE, nivel: 'iniciante', objetivo: 'condicionamento', tempo_sessao_min: 15 }, EXERCICIOS)
  const avancado = gerarPlanoTreino({ ...BASE, nivel: 'avancado', objetivo: 'condicionamento', tempo_sessao_min: 15 }, EXERCICIOS)
  const exIniciante = iniciante.semanas[0].sessoes[0].itens.length
  const exAvancado = avancado.semanas[0].sessoes[0].itens.length
  assert.ok(exIniciante <= exAvancado)
  assert.equal(iniciante.semanas[0].sessoes[0].itens[0].series, 3)
  assert.equal(avancado.semanas[0].sessoes[0].itens[0].series, 4)
})

test('objetivo emagrecer força reps 12-15 e descanso 45s', () => {
  const plano = gerarPlanoTreino({ ...BASE, objetivo: 'emagrecer', biotipo: 'mesomorfo' }, EXERCICIOS)
  const item = plano.semanas[0].sessoes[0].itens[0]
  assert.equal(item.reps_min, 12)
  assert.equal(item.reps_max, 15)
  assert.equal(item.descanso_seg, 45)
})

test('objetivo força usa 4-6 reps só nos compostos', () => {
  const plano = gerarPlanoTreino({ ...BASE, objetivo: 'forca', biotipo: 'mesomorfo' }, EXERCICIOS)
  const itens = plano.semanas[0].sessoes[0].itens
  for (const item of itens) {
    const exercicio = EXERCICIOS.find((e) => e.id === item.exercicio_id)!
    if (exercicio.is_composto) {
      assert.equal(item.reps_min, 4)
      assert.equal(item.reps_max, 6)
      assert.equal(item.descanso_seg, 120)
    }
  }
})

test('biotipo ectomorfo remove 1 exercício e soma 15s de descanso', () => {
  const meso = gerarPlanoTreino({ ...BASE, biotipo: 'mesomorfo', objetivo: 'condicionamento' }, EXERCICIOS)
  const ecto = gerarPlanoTreino({ ...BASE, biotipo: 'ectomorfo', objetivo: 'condicionamento' }, EXERCICIOS)
  const sessaoMeso = meso.semanas[0].sessoes[0]
  const sessaoEcto = ecto.semanas[0].sessoes[0]
  assert.equal(sessaoEcto.itens.length, sessaoMeso.itens.length - 1)
  assert.equal(sessaoEcto.itens[0].descanso_seg, sessaoMeso.itens[0].descanso_seg + 15)
})

test('biotipo endomorfo reduz 15s de descanso e adiciona bloco de cardio', () => {
  const meso = gerarPlanoTreino({ ...BASE, biotipo: 'mesomorfo', objetivo: 'condicionamento' }, EXERCICIOS)
  const endo = gerarPlanoTreino({ ...BASE, biotipo: 'endomorfo', objetivo: 'condicionamento' }, EXERCICIOS)
  const sessaoMeso = meso.semanas[0].sessoes[0]
  const sessaoEndo = endo.semanas[0].sessoes[0]
  assert.equal(sessaoMeso.cardio_min, null)
  assert.ok(sessaoEndo.cardio_min !== null && sessaoEndo.cardio_min > 0)
  assert.equal(sessaoEndo.itens[0].descanso_seg, sessaoMeso.itens[0].descanso_seg - 15)
})

test('local "Casa" só usa peso corporal, halter e elástico', () => {
  const plano = gerarPlanoTreino({ ...BASE, local_treino: 'casa', dias_semana: 3 }, EXERCICIOS)
  for (const sessao of plano.semanas[0].sessoes) {
    for (const item of sessao.itens) {
      const exercicio = EXERCICIOS.find((e) => e.id === item.exercicio_id)!
      assert.ok(['Peso corporal', 'Halter', 'Elástico'].includes(exercicio.equipamento))
    }
  }
})

test('tempo de sessão maior aumenta o total de séries (minutos / 3)', () => {
  const curto = gerarPlanoTreino({ ...BASE, tempo_sessao_min: 30 }, EXERCICIOS)
  const longo = gerarPlanoTreino({ ...BASE, tempo_sessao_min: 90 }, EXERCICIOS)
  const seriesCurto = curto.semanas[0].sessoes[0].itens.reduce((s, i) => s + i.series, 0)
  const seriesLongo = longo.semanas[0].sessoes[0].itens.reduce((s, i) => s + i.series, 0)
  assert.ok(seriesLongo > seriesCurto)
})

test('progressão: semanas 1 a 4 são iguais (adaptação)', () => {
  const plano = gerarPlanoTreino(BASE, EXERCICIOS)
  assert.deepEqual(plano.semanas[0].sessoes, plano.semanas[3].sessoes)
})

test('progressão: semana 5 adiciona 1 série nos exercícios compostos', () => {
  const plano = gerarPlanoTreino(BASE, EXERCICIOS)
  const semana4 = plano.semanas[3].sessoes[0].itens
  const semana5 = plano.semanas[4].sessoes[0].itens
  for (let i = 0; i < semana4.length; i++) {
    const exercicio = EXERCICIOS.find((e) => e.id === semana4[i].exercicio_id)!
    const esperado = exercicio.is_composto ? semana4[i].series + 1 : semana4[i].series
    assert.equal(semana5[i].series, esperado)
  }
})

test('progressão: semanas 9 a 11 marcam técnica avançada em 1 exercício, só fora do nível iniciante', () => {
  const intermediario = gerarPlanoTreino({ ...BASE, nivel: 'intermediario' }, EXERCICIOS)
  const iniciante = gerarPlanoTreino({ ...BASE, nivel: 'iniciante' }, EXERCICIOS)

  const temAvancadaIntermediario = intermediario.semanas[8].sessoes[0].itens.some((i) => i.tecnica === 'avancada')
  const temAvancadaIniciante = iniciante.semanas[8].sessoes[0].itens.some((i) => i.tecnica === 'avancada')

  assert.equal(temAvancadaIntermediario, true)
  assert.equal(temAvancadaIniciante, false)
})

test('progressão: semana 12 é deload com 60% das séries', () => {
  const plano = gerarPlanoTreino(BASE, EXERCICIOS)
  const semana11 = plano.semanas[10].sessoes[0].itens
  const semana12 = plano.semanas[11].sessoes[0].itens
  assert.equal(plano.semanas[11].deload, true)
  for (let i = 0; i < semana11.length; i++) {
    assert.equal(semana12[i].series, Math.max(1, Math.round(semana11[i].series * 0.6)))
  }
})
