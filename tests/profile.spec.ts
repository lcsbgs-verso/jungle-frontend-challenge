import { expect, test } from '@playwright/test'
import { login } from './helpers'

test.describe('Perfil e carteiras', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, '/perfil')
  })

  test('editar dados do perfil com validação', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /perfil/i })).toBeVisible()

    // Editar nome
    const nameInput = page.getByLabel(/nome/i)
    await nameInput.clear()
    await nameInput.fill('Alice Silva Costa')

    // Editar telefone
    const phoneInput = page.getByLabel(/telefone/i)
    if (await phoneInput.isVisible()) {
      await phoneInput.clear()
      await phoneInput.fill('(11) 98888-7777')
    }

    // Salvar
    await page.getByRole('button', { name: /salvar/i }).click()
    await expect(page.getByText(/salvo|atualizado|sucesso/i)).toBeVisible()

    // Recarregar e verificar persistência
    await page.reload()
    await expect(nameInput).toHaveValue('Alice Silva Costa')
  })

  test('alterar senha com validação', async ({ page }) => {
    // Navegar para seção de senha
    const passwordSection = page.locator('text=/senha|password/i').first()
    if (await passwordSection.isVisible()) {
      await passwordSection.scrollIntoViewIfNeeded()

      // Preencher senhas
      const currentPassword = page.getByLabel(/senha atual|current password/i)
      const newPassword = page.getByLabel(/nova senha|new password/i, { exact: false })
      const confirmPassword = page.getByLabel(/confirmar|confirm/i)

      if (await currentPassword.isVisible()) {
        await currentPassword.fill('Kurio2026!')
        await newPassword.fill('NovaSenha2026!')
        await confirmPassword.fill('NovaSenha2026!')

        await page.getByRole('button', { name: /alterar senha|change password/i }).click()
        await expect(page.getByText(/alterada|atualizada|sucesso/i)).toBeVisible()
      }
    }
  })

  test('gerenciar carteiras', async ({ page }) => {
    await page.goto('/carteiras')
    await expect(page.getByRole('heading', { name: /carteira/i })).toBeVisible()

    // Editar carteira principal
    const addressInput = page.getByLabel(/endereço|address/i).first()
    const currentAddress = await addressInput.inputValue()

    await addressInput.clear()
    await addressInput.fill('0x' + '1'.repeat(40))

    await page.getByRole('button', { name: /salvar/i }).first().click()
    await expect(page.getByText(/salv|atualiz/i)).toBeVisible()

    // Recarregar e verificar
    await page.reload()
    await expect(addressInput).toHaveValue('0x' + '1'.repeat(40))

    // Restaurar endereço original
    await addressInput.clear()
    await addressInput.fill(currentAddress)
    await page.getByRole('button', { name: /salvar/i }).first().click()
  })

  test('validação de endereço de carteira', async ({ page }) => {
    await page.goto('/carteiras')

    const addressInput = page.getByLabel(/endereço|address/i).first()
    await addressInput.clear()
    await addressInput.fill('endereço-invalido')

    await page.getByRole('button', { name: /salvar/i }).first().click()
    await expect(page.getByText(/inválid|formato/i)).toBeVisible()
  })
})
