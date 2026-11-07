import { expect, test } from '@playwright/test'
import { act, checkout, confirm, socketReady } from './helpers'

test('compra completa e recibo preservado após alteração de preço', async ({ page }) => {
  await checkout(page)
  await confirm(page)
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  const receipt = page.getByRole('region', { name: 'Resumo do pedido' })
  await expect(receipt).toContainText('2,468 ETH')
  await act(page, { type: 'price' })
  await page.reload()
  await expect(receipt).toContainText('2,468 ETH')
  await page.goto('/carrinho')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('evento de preço em tempo real atualiza cotação em revisão', async ({ page }) => {
  await checkout(page)
  await socketReady(page)
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await act(page, { type: 'price' })
  await expect(page.getByRole('dialog')).toContainText('A cotação mudou durante a revisão')
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
  await page.getByRole('button', { name: 'Atualizar revisão' }).click()
  await expect(page.getByRole('region', { name: 'Resumo do pedido' })).toContainText('2,618 ETH')
})
