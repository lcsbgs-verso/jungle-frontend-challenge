import { expect, test } from '@playwright/test'
import { act, login } from './helpers'

test.describe('Favoritos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('adicionar e remover favorito', async ({ page }) => {
    await page.goto('/nft/emerald-ape')
    
    // Adicionar aos favoritos
    const favoriteButton = page.getByRole('button', { name: /favorit/i }).first()
    await favoriteButton.click()
    await expect(page.getByText(/adicionad|favoritad/i)).toBeVisible()

    // Remover dos favoritos
    await favoriteButton.click()
    await expect(page.getByText(/removid/i)).toBeVisible()
  })

  test('favorito com falha e recuperação de estado', async ({ page }) => {
    // Configurar cenário de falha
    await act(page, { type: 'scenario', scenario: 'favoriteFailure' })

    await page.goto('/nft/emerald-ape')
    
    // Tentar adicionar aos favoritos (deve falhar)
    const favoriteButton = page.getByRole('button', { name: /favorit/i }).first()
    const initialState = await favoriteButton.getAttribute('aria-pressed') || 
                        await favoriteButton.getAttribute('data-favorited') ||
                        'false'
    
    await favoriteButton.click()
    
    // Deve mostrar erro
    await expect(page.getByText(/erro|falha|tente novamente/i)).toBeVisible()

    // Estado deve ser revertido (rollback)
    await page.waitForTimeout(500)
    const currentState = await favoriteButton.getAttribute('aria-pressed') || 
                        await favoriteButton.getAttribute('data-favorited') ||
                        'false'
    expect(currentState).toBe(initialState)

    // Restaurar cenário padrão
    await act(page, { type: 'scenario', scenario: 'default' })

    // Tentar novamente (deve funcionar)
    await favoriteButton.click()
    await expect(page.getByText(/adicionad|favoritad|removid/i)).toBeVisible()
  })

  test('favoritos persistem entre navegações', async ({ page }) => {
    await page.goto('/nft/emerald-ape')
    
    const favoriteButton = page.getByRole('button', { name: /favorit/i }).first()
    await favoriteButton.click()
    await page.waitForTimeout(300)

    // Navegar para outra página
    await page.goto('/')
    
    // Voltar para o NFT
    await page.goto('/nft/emerald-ape')
    
    // Verificar que ainda está favoritado
    const isFavorited = await favoriteButton.getAttribute('aria-pressed') === 'true' ||
                       await favoriteButton.getAttribute('data-favorited') === 'true' ||
                       (await favoriteButton.getAttribute('class') || '').includes('favorited')
    
    expect(isFavorited).toBeTruthy()
  })
})
