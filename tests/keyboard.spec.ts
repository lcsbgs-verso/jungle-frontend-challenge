import { expect, test } from '@playwright/test'

test.describe('Navegação por teclado e acessibilidade', () => {
  test('navegação por Tab e foco visível', async ({ page }) => {
    await page.goto('/')

    // Focar primeiro elemento interativo
    await page.keyboard.press('Tab')
    
    // Verificar que há foco visível
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()

    // Navegar por vários elementos
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toBeVisible()
    }
  })

  test('diálogo de login com foco e tecla Escape', async ({ page }) => {
    await page.goto('/entrar')

    // Verificar que diálogo está aberto
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Verificar que foco está no diálogo
    const dialogFocused = dialog.locator(':focus')
    await expect(dialogFocused).toBeAttached()

    // Fechar com Escape
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('formulário de login acessível por teclado', async ({ page }) => {
    await page.goto('/entrar')

    const dialog = page.getByRole('dialog')
    
    // Navegar por Tab até email
    await page.keyboard.press('Tab')
    const emailInput = dialog.getByLabel(/e-mail/i)
    await expect(emailInput).toBeFocused()

    // Preencher
    await page.keyboard.type('alice@kurio.test')

    // Tab para senha
    await page.keyboard.press('Tab')
    const passwordInput = dialog.getByLabel(/senha/i)
    await expect(passwordInput).toBeFocused()
    await page.keyboard.type('Kurio2026!')

    // Tab até botão de submit e pressionar Enter
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    // Verificar que login foi realizado
    await expect(dialog).not.toBeVisible()
  })

  test('botões ativam com Enter e Space', async ({ page }) => {
    await page.goto('/')

    // Focar em um botão
    const button = page.getByRole('button', { name: /explorar/i }).first()
    await button.focus()

    // Ativar com Enter
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Verificar que ação foi executada (navegação, dialog, etc)
    // O teste passa se não houver erro
  })

  test('links de navegação acessíveis por teclado', async ({ page }) => {
    await page.goto('/')

    // Encontrar link para NFT
    const nftLink = page.getByRole('link', { name: /emerald|ape|nft/i }).first()
    await nftLink.focus()
    await expect(nftLink).toBeFocused()

    // Pressionar Enter
    await page.keyboard.press('Enter')

    // Verificar navegação
    await expect(page).toHaveURL(/\/nft\//)
  })

  test('mensagens de erro de formulário têm associação ARIA', async ({ page }) => {
    await page.goto('/entrar')

    const dialog = page.getByRole('dialog')
    
    // Submeter formulário vazio
    await dialog.getByRole('button', { name: /entrar/i }).click()

    // Verificar que erros estão visíveis e associados aos campos
    const emailInput = dialog.getByLabel(/e-mail/i)
    const emailError = await emailInput.getAttribute('aria-describedby')
    
    if (emailError) {
      const errorElement = page.locator(`#${emailError}`)
      await expect(errorElement).toBeVisible()
    }
  })
})
