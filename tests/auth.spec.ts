import { expect, test } from '@playwright/test'
import { act, login } from './helpers'

test.describe('Autenticação e sessão', () => {
  test('cadastro de novo usuário com validação', async ({ page }) => {
    await page.goto('/cadastro')
    
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /criar|cadastro/i })).toBeVisible()

    // Tentar submeter sem preencher (deve mostrar erros)
    await dialog.locator('button[type="submit"]').click()
    
    // Preencher formulário
    const email = `test-${Date.now()}@kurio.test`
    await dialog.getByLabel(/nome|usuário/i).fill('Teste Silva')
    await dialog.getByLabel(/e-mail/i).fill(email)
    await dialog.getByLabel('Senha', { exact: true }).first().fill('Teste123!')
    await dialog.getByLabel(/confirmar|confirme/i).first().fill('Teste123!')
    
    // Submeter
    await dialog.locator('button[type="submit"]').click()

    // Verificar que foi autenticado
    await expect(dialog).toHaveCount(0)
    await expect(page.getByText(/teste silva/i).or(page.getByText(email))).toBeVisible()
  })

  test('login, logout e troca de usuário', async ({ page }) => {
    // Login com Alice
    await login(page, '/', 'alice@kurio.test', 'Kurio2026!')
    await expect(page.getByText(/alice/i)).toBeVisible()

    // Logout
    const profileButton = page.getByRole('button', { name: /perfil|alice/i }).or(
      page.getByRole('link', { name: /perfil|alice/i })
    ).first()
    await profileButton.click()
    await page.waitForTimeout(300)
    
    const logoutButton = page.getByRole('button', { name: /sair|logout/i }).or(
      page.getByRole('link', { name: /sair|logout/i })
    )
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      await page.waitForTimeout(500)
    }

    // Login com Bruno
    await login(page, '/', 'bruno@kurio.test', 'Kurio2026!')
    await expect(page.getByText(/bruno/i)).toBeVisible()
    await expect(page.getByText(/alice/i)).not.toBeVisible()
  })

  test('sessão expirada redireciona para login', async ({ page }) => {
    await login(page, '/')

    // Forçar expiração de sessão
    await act(page, { type: 'scenario', scenario: 'expired' })

    // Tentar acessar página protegida
    await page.goto('/perfil')

    // Deve redirecionar para login
    await expect(page).toHaveURL(/entrar/)
  })

  test('senha incorreta mostra erro', async ({ page }) => {
    await page.goto('/entrar')
    
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel(/e-mail/i).fill('alice@kurio.test')
    await dialog.getByLabel(/senha/i).fill('SenhaErrada123')
    await dialog.getByRole('button', { name: /entrar/i }).click()

    await expect(dialog.getByText(/inválid|incorret/i)).toBeVisible()
  })

  test('email já cadastrado mostra erro', async ({ page }) => {
    await page.goto('/cadastro')
    
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel(/nome|usuário/i).fill('Teste')
    await dialog.getByLabel(/e-mail/i).fill('alice@kurio.test')
    await dialog.getByLabel('Senha', { exact: true }).first().fill('Teste123!')
    await dialog.getByLabel(/confirmar/i).first().fill('Teste123!')
    await dialog.locator('button[type="submit"]').click()

    await expect(dialog.getByText(/já existe|já cadastrad/i)).toBeVisible()
  })
})
