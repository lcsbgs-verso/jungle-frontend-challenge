import { test, expect } from '@playwright/test'
import { login, fillLogin, addEmerald } from './helpers'

test.describe('User isolation explicit', () => {
  test('User A cart isolated from User B', async ({ page, context }) => {
    // User A adds item
    await addEmerald(page)
    await login(page)
    await page.goto('/carrinho')
    await expect(page.getByText('Emerald Ape #042')).toBeVisible()
    
    // User B in new tab
    const pageB = await context.newPage()
    await pageB.goto('/entrar')
    await fillLogin(pageB, 'bruno@kurio.test', 'Kurio2026!')
    await pageB.goto('/carrinho')
    await expect(pageB.getByText(/carrinho vazio|nenhum item/i)).toBeVisible()
    await expect(pageB.getByText('Emerald Ape #042')).toHaveCount(0)
  })

  test('User A favorites isolated from User B', async ({ page, context }) => {
    await page.goto('/nft/emerald-ape')
    await login(page)
    await page.getByRole('button', { name: /favorit/i }).first().click()
    await page.goto('/perfil')
    await expect(page.getByText('Emerald Ape #042')).toBeVisible()
    
    const pageB = await context.newPage()
    await pageB.goto('/entrar')
    await fillLogin(pageB, 'bruno@kurio.test', 'Kurio2026!')
    await pageB.goto('/perfil')
    // User B should not see User A's favorites
    await expect(pageB.getByText('Emerald Ape #042')).toHaveCount(0)
  })
})
