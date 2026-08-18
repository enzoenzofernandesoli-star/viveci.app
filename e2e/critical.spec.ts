import { expect, test, type Page, type Route } from 'playwright/test'

const userId = '11111111-1111-4111-8111-111111111111'

type BackendState = {
  onboarding: boolean
  planos: Record<string, unknown>[]
  sessoes: Record<string, unknown>[]
  itens: Record<string, unknown>[]
  cardio: Record<string, unknown>[]
  registrosCriados: number
  sessoesFinalizadas: number
  exclusoesConta: number
  exclusaoContaFalha: boolean
}

function perfil(onboarding: boolean) {
  return {
    id: userId, nome: onboarding ? 'Pessoa Beta' : null, foto_url: null, bio: null,
    sexo: onboarding ? 'masculino' : null, idade: onboarding ? 28 : null,
    altura_cm: onboarding ? 178 : null, peso_kg: onboarding ? 75 : null,
    objetivo: onboarding ? 'ganhar_massa' : null, nivel: null, local_treino: null,
    dias_semana: onboarding ? 4 : null, tempo_sessao_min: null, biotipo: null,
    onboarding_completo: onboarding, plano: 'pro', criado_em: '2026-08-01T00:00:00.000Z',
  }
}

function authSession() {
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: 'e2e-token', refresh_token: 'e2e-refresh', expires_in: 360000,
    expires_at: now + 360000, token_type: 'bearer',
    user: {
      id: userId, aud: 'authenticated', role: 'authenticated', email: 'beta@viveci.test',
      app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {},
      created_at: '2026-08-01T00:00:00.000Z',
    },
  }
}

async function fulfillJson(route: Route, data: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
}

async function mockBackend(page: Page, state: BackendState) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: 'sb-tygbdcbsovngaqdpgord-auth-token', value: authSession(),
  })
  await page.route('**/auth/v1/user', (route) => fulfillJson(route, authSession().user))
  await page.route('**/auth/v1/logout*', (route) => fulfillJson(route, {}))
  await page.route('**/functions/v1/excluir-conta', (route) => {
    state.exclusoesConta++
    return fulfillJson(route, state.exclusaoContaFalha ? { erro: 'Falha simulada.' } : { excluida: true }, state.exclusaoContaFalha ? 500 : 200)
  })
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()
    const single = request.headers().accept?.includes('application/vnd.pgrst.object+json')

    if (path.endsWith('/rpc/criar_rotina')) {
      const body = request.postDataJSON() as { p_nome: string }
      const plano = { id: 'plano-novo', user_id: userId, nome: body.p_nome, data_inicio: new Date().toISOString(), ativo: true }
      const sessao = { id: 'sessao-nova', plano_id: 'plano-novo' }
      state.planos.push(plano); state.sessoes.push(sessao)
      return fulfillJson(route, [{ rotina_id: 'plano-novo', sessao_id: 'sessao-nova' }])
    }
    if (path.endsWith('/rpc/salvar_itens_rotina')) {
      const body = request.postDataJSON() as { p_itens: { exercicio_id: number; ordem: number }[] }
      state.itens = body.p_itens.map((item, index) => ({
        id: `item-${index}`, sessao_id: 'sessao-nova', exercicio_id: item.exercicio_id,
        series: 3, reps_min: 8, reps_max: 12, descanso_seg: 90, ordem: item.ordem, tecnica: 'normal',
      }))
      return fulfillJson(route, null)
    }

    const table = path.split('/').at(-1)
    if (table === 'perfis') {
      if (method === 'PATCH') state.onboarding = true
      return fulfillJson(route, single ? perfil(state.onboarding) : [perfil(state.onboarding)])
    }
    if (table === 'planos') return fulfillJson(route, single ? (state.planos[0] ?? null) : state.planos)
    if (table === 'plano_sessoes') return fulfillJson(route, single ? (state.sessoes[0] ?? null) : state.sessoes)
    if (table === 'plano_itens') return fulfillJson(route, state.itens)
    if (table === 'registros') {
      if (method === 'POST') state.registrosCriados++
      return fulfillJson(route, [])
    }
    if (table === 'sessoes_concluidas') {
      if (method === 'POST') return fulfillJson(route, { id: 'sessao-concluida-1' })
      if (method === 'PATCH') state.sessoesFinalizadas++
      return fulfillJson(route, [])
    }
    if (table === 'cardio_sessoes') {
      if (method === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>
        state.cardio = [{ id: 'cardio-1', data: new Date().toISOString(), ...body }]
        return fulfillJson(route, [])
      }
      return fulfillJson(route, state.cardio)
    }
    return fulfillJson(route, single ? null : [])
  })
}

function baseState(onboarding = true): BackendState {
  return { onboarding, planos: [], sessoes: [], itens: [], cardio: [], registrosCriados: 0, sessoesFinalizadas: 0, exclusoesConta: 0, exclusaoContaFalha: false }
}

test('onboarding preserva o passo atual após atualizar', async ({ page }) => {
  const state = baseState(false)
  await mockBackend(page, state)
  await page.goto('/onboarding')
  await page.getByPlaceholder('Seu nome').fill('Pessoa Beta')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Masculino' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Qual sua idade?' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Qual sua idade?' })).toBeVisible()
})

test('cria rotina com exercício e salva uma única vez', async ({ page }) => {
  const state = baseState()
  await mockBackend(page, state)
  await page.goto('/treino/nova')
  await page.getByPlaceholder('Título da rotina').fill('Push Beta')
  await page.getByRole('button', { name: '+ Adicionar exercício' }).click()
  await page.getByRole('button', { name: /Supino reto com barra/ }).click()
  await page.getByRole('button', { name: 'Salvar' }).dblclick()
  await expect(page).toHaveURL(/\/treino$/)
  await expect(page.getByText('Push Beta', { exact: true })).toBeVisible()
  expect(state.planos).toHaveLength(1)
  expect(state.itens).toHaveLength(1)
})

test('registra uma série uma vez e finaliza o treino', async ({ page }) => {
  const state = baseState()
  state.planos = [{ id: 'plano-push', user_id: userId, nome: 'Push Beta', data_inicio: new Date().toISOString(), ativo: true }]
  state.sessoes = [{ id: 'sessao-push', plano_id: 'plano-push' }]
  state.itens = [{ id: 'item-push', sessao_id: 'sessao-push', exercicio_id: 1, series: 1, reps_min: 8, reps_max: 12, descanso_seg: 0, ordem: 1, tecnica: 'normal' }]
  await mockBackend(page, state)
  await page.goto('/treino/plano-push/sessao')
  await page.locator('input[inputmode="decimal"]').fill('40')
  await page.locator('input[inputmode="numeric"]').fill('10')
  await page.getByRole('button', { name: 'Concluir série' }).dblclick()
  await expect.poll(() => state.registrosCriados).toBe(1)
  await page.getByRole('button', { name: 'Concluir', exact: true }).click()
  await expect(page.getByText('Treino concluído', { exact: true })).toBeVisible()
  expect(state.sessoesFinalizadas).toBe(1)
})

test('registra cardio e mostra no histórico', async ({ page }) => {
  const state = baseState()
  await mockBackend(page, state)
  await page.goto('/treino')
  await page.getByRole('button', { name: /Cardio/ }).last().click()
  await page.getByLabel('Duração (min)').fill('30')
  await page.getByLabel('Distância (km)').fill('5')
  await page.getByRole('button', { name: 'Registrar' }).dblclick()
  await expect(page.getByText(/30 min/)).toBeVisible()
  expect(state.cardio).toHaveLength(1)
})

test('exclusão de conta exige confirmação e envia uma única solicitação', async ({ page }) => {
  const state = baseState()
  await mockBackend(page, state)
  await page.goto('/perfil/configuracoes')
  await page.getByRole('button', { name: /Privacidade e segurança/ }).click()
  await page.getByRole('button', { name: 'Excluir minha conta' }).click()
  const excluir = page.getByRole('button', { name: 'Excluir definitivamente' })
  await expect(excluir).toBeDisabled()
  await page.getByLabel('Digite EXCLUIR para confirmar').fill('EXCLUIR')
  await excluir.dblclick()
  await expect(page).toHaveURL(/\/login$/)
  expect(state.exclusoesConta).toBe(1)
})

test('falha na exclusão não declara sucesso nem encerra a sessão', async ({ page }) => {
  const state = baseState()
  state.exclusaoContaFalha = true
  await mockBackend(page, state)
  await page.goto('/perfil/configuracoes')
  await page.getByRole('button', { name: /Privacidade e segurança/ }).click()
  await page.getByRole('button', { name: 'Excluir minha conta' }).click()
  await page.getByLabel('Digite EXCLUIR para confirmar').fill('EXCLUIR')
  await page.getByRole('button', { name: 'Excluir definitivamente' }).click()
  await expect(page.getByText(/Nenhum sucesso foi confirmado/)).toBeVisible()
  await expect(page).toHaveURL(/\/perfil\/configuracoes$/)
  expect(state.exclusoesConta).toBe(1)
})
