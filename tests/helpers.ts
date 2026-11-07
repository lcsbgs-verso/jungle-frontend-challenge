import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { DemoAction } from '../src/domain'

export async function act(page: Page, action: DemoAction) {
  const status = await page.evaluate(async (payload) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = localStorage.getItem('kurio.session')
    if (token) headers.Authorization = 'Bearer ' + token
    const response = await fetch('/api/__demo', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    return response.status
  }, action)
  expect(status).toBe(200)
}

export async function login(
  page: Page,
  next = '/',
  email = 'alice@kurio.test',
  password = 'Kurio2026!',
) {
  await page.goto('/entrar?next=' + encodeURIComponent(next))
  await fillLogin(page, email, password)
}

export async function fillLogin(page: Page, email = 'alice@kurio.test', password = 'Kurio2026!') {
  // Works for both desktop (dialog) and mobile (main form)
  const container = page.getByRole('dialog').or(page.locator('form'))
  await container.getByLabel('E-mail').fill(email)
  // Mobile has single password, desktop may have multiple
  await container.getByLabel(/senha|password/i).first().fill(password)
  await container.locator('button[type="submit"]').click()
  // Desktop: dialog closes, Mobile: navigates away
  await page.waitForTimeout(500)
}

export async function addEmerald(page: Page) {
  await page.goto('/nft/emerald-ape')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  await expect(page.getByText('Obra adicionada ao carrinho.')).toBeVisible()
}

export async function connectWallet(page: Page) {
  await page.getByRole('button', { name: 'Conectar carteira', exact: true }).click()
  await page.getByRole('button', { name: 'Autorizar conexão' }).click()
  await expect(page.getByText('Carteira conectada', { exact: true })).toBeVisible()
}

export async function checkout(page: Page) {
  await addEmerald(page)
  await login(page, '/pagamento')
  await expect(page.getByRole('heading', { name: 'Pagamento', exact: true })).toBeVisible()
  await connectWallet(page)
}

export async function review(page: Page) {
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('dialog', { name: 'Revise seu pedido' })).toBeVisible()
}

export async function confirm(page: Page) {
  await review(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
}

export async function socketReady(page: Page) {
  const demoButton = page.getByRole('button', { name: 'Cenários da demo' })
  await demoButton.scrollIntoViewIfNeeded()
  await demoButton.click()
  await expect(page.getByText('Tempo real conectado', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Fechar', exact: true }).click()
}
