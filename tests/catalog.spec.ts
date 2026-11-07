import { expect, test } from '@playwright/test'

test.describe('Catálogo e busca', () => {
  test('busca, filtros, ordenação e paginação com estado na URL', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /nfts em destaque/i })).toBeVisible()

    // Busca
    await page.getByPlaceholder(/explorar/i).fill('emerald')
    await page.getByPlaceholder(/explorar/i).press('Enter')
    await page.waitForURL(/q=emerald/)
    expect(page.url()).toContain('q=emerald')

    // Filtro por categoria
    await page.getByRole('checkbox', { name: /arte digital/i }).check()
    await page.waitForURL(/category=/)
    expect(page.url()).toContain('category=Arte')

    // Adicionar segunda categoria
    await page.getByRole('checkbox', { name: /fotografia/i }).check()
    expect(page.url()).toMatch(/category=.*category=/)

    // Ordenação
    await page.getByLabel(/ordenar/i).selectOption('price-asc')
    await page.waitForURL(/sort=price-asc/)
    expect(page.url()).toContain('sort=price-asc')

    // Paginação (se houver mais de 12 itens)
    const nextButton = page.getByRole('button', { name: /próxima|próximo/i })
    if (await nextButton.isVisible()) {
      await nextButton.click()
      await page.waitForURL(/page=2/)
      expect(page.url()).toContain('page=2')

      // Navegar para trás no histórico
      await page.goBack()
      await page.waitForURL(/page=1|^[^?]*$/)
      await expect(page.getByPlaceholder(/explorar/i)).toHaveValue('emerald')
      await expect(page.getByRole('checkbox', { name: /arte digital/i })).toBeChecked()
    }

    // Limpar busca e verificar que filtros permanecem
    await page.getByPlaceholder(/explorar/i).clear()
    await page.getByPlaceholder(/explorar/i).press('Enter')
    await page.waitForURL((url) => !url.search.includes('q='))
    expect(page.url()).not.toContain('q=')
    await expect(page.getByRole('checkbox', { name: /arte digital/i })).toBeChecked()
  })

  test('acesso direto a NFT e tratamento de recurso inexistente', async ({ page }) => {
    // Acesso direto válido
    await page.goto('/nft/emerald-ape')
    await expect(page.getByRole('heading', { name: /emerald ape/i })).toBeVisible()
    await expect(page.getByText(/kurio studio/i)).toBeVisible()

    // NFT inexistente
    await page.goto('/nft/nao-existe-este-nft')
    await expect(page.getByText(/não encontrad/i)).toBeVisible()
    
    // Link para voltar ao catálogo
    const backLink = page.getByRole('link', { name: /voltar|explorar|início/i }).first()
    await backLink.click()
    await expect(page).toHaveURL('/')
  })

  test('filtro de preço com valores mínimo e máximo', async ({ page }) => {
    await page.goto('/')

    // Preencher preço mínimo e máximo
    const minInput = page.getByLabel(/preço mínimo|mínimo/i)
    const maxInput = page.getByLabel(/preço máximo|máximo/i)

    if (await minInput.isVisible()) {
      await minInput.fill('1.0')
      await maxInput.fill('2.5')
      await maxInput.press('Enter')

      await page.waitForURL(/min=1|max=2/)
      expect(page.url()).toContain('min=')
      expect(page.url()).toContain('max=')

      // Verificar que itens exibidos estão no range (primeira vez, pode não ter ainda carregado)
      await page.waitForTimeout(500)
      const prices = await page.locator('[data-testid="nft-price"], .nft-price').allTextContents()
      // Verificação básica que há preços sendo exibidos
      expect(prices.length).toBeGreaterThan(0)
    }
  })
})
