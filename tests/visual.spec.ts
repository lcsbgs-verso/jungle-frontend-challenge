import { expect, test } from '@playwright/test'
import { addEmerald, checkout } from './helpers'

test('regressão visual da página inicial', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('27 obras encontradas')).toBeVisible()
  await expect(page).toHaveScreenshot('inicio.png', { fullPage: true, scale: 'css' })
})

test('regressão visual do detalhe', async ({ page }) => {
  await page.goto('/nft/emerald-ape')
  await expect(page.getByRole('heading', { name: 'Mais obras para explorar' })).toBeVisible()
  await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true, scale: 'css' })
})

test('regressão visual do carrinho', async ({ page }) => {
  await addEmerald(page)
  await page.goto('/carrinho')
  await expect(page.getByRole('region', { name: 'Resumo do pedido' })).toContainText('2,468 ETH')
  await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true, scale: 'css' })
})

test('regressão visual do pagamento', async ({ page }) => {
  await checkout(page)
  await expect(page.getByRole('region', { name: 'Resumo do pedido' })).toContainText('2,468 ETH')
  await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true, scale: 'css' })
})

test('não há transbordamento horizontal em tablet', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await checkout(page)
  for (const path of [
    '/',
    '/nft/emerald-ape',
    '/carrinho',
    '/pagamento',
    '/perfil',
    '/carteiras',
  ]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768)
  }
})
