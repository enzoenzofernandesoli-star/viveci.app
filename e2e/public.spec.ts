import { expect, test } from 'playwright/test'

test('login renderiza o acesso principal', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Entre na sua conta.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
})

test('recuperação de senha abre pelo login', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
  await expect(page).toHaveURL(/\/recuperar-senha$/)
  await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible()
})

test('rota privada redireciona visitante para login', async ({ page }) => {
  await page.goto('/treino')
  await expect(page).toHaveURL(/\/login$/)
})
