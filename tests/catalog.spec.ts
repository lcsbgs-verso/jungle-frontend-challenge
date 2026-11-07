import { expect, test } from '@playwright/test'
import { act } from './helpers'

test('busca, filtros combinados, ordenação, paginação e histórico', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('27 obras encontradas')).toBeVisible()
  await page.getByRole('button', { name: 'Página 2', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByRole('button', { name: 'Página 2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Página 1', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )

  const filters = page.getByRole('button', { name: 'Filtros', exact: true })
  if (await filters.isVisible()) await filters.click()
  await page.getByRole('checkbox', { name: /Arte digital/ }).check()
  await page.getByRole('checkbox', { name: /Fotografia/ }).check()
  const results = page.getByRole('button', { name: 'Ver resultados' })
  if (await results.isVisible()) await results.click()
  await expect(page.getByText('6 obras encontradas')).toBeVisible()
  await expect(page).toHaveURL(/category=Arte\+digital&category=Fotografia/)
  await page.getByRole('combobox', { name: 'Ordenar por' }).selectOption('price-asc')
  await expect(page).toHaveURL(/sort=price-asc/)
  const input = page.getByRole('textbox', { name: 'Buscar no catálogo' })
  await input.fill('Emerald')
  await input.press('Enter')
  await expect(page.getByText('2 obras encontradas')).toBeVisible()
  await page.reload()
  await expect(input).toHaveValue('Emerald')
  await expect(page.getByText('2 obras encontradas')).toBeVisible()
  await page.goBack()
  await expect(input).toHaveValue('')
  await expect(page.getByText('6 obras encontradas')).toBeVisible()
})

test('detalhe direto, galeria e rota inexistente', async ({ page }) => {
  await page.goto('/nft/emerald-ape')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Mostrar imagem 2' }).click()
  await expect(page.getByRole('img', { name: /imagem 2 de 3/ })).toBeVisible()
  await page.getByLabel('Quantidade', { exact: true }).fill('999')
  await expect(page.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeDisabled()
  await page.goto('/nft/inexistente')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  await page.goto('/rota-inexistente')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
})

test('ignora busca obsoleta e representa resultados vazios', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('27 obras encontradas')).toBeVisible()
  await act(page, { type: 'scenario', scenario: 'race' })
  const input = page.getByRole('textbox', { name: 'Buscar no catálogo' })
  await input.fill('E')
  await input.press('Enter')
  await expect(page).toHaveURL(/q=E$/)
  await input.fill('Sage')
  await input.press('Enter')
  await expect(page.getByText('3 obras encontradas')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sage Nomad #009', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Emerald Ape #042', exact: true })).toHaveCount(0)
  await input.fill('colecao que nao existe')
  await input.press('Enter')
  await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
})

test('skeleton, falha de rede, resposta HTTP e recuperação', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('27 obras encontradas')).toBeVisible()
  await act(page, { type: 'scenario', scenario: 'slow' })
  await page.reload()
  await expect(page.getByRole('status', { name: 'Carregando catálogo' })).toBeVisible()
  await expect(page.getByText('27 obras encontradas')).toBeVisible()
  for (const scenario of ['offline', 'httpError'] as const) {
    await act(page, { type: 'scenario', scenario })
    await page.reload()
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
    await act(page, { type: 'scenario', scenario: 'default' })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('27 obras encontradas')).toBeVisible()
  }
})

test('teclado, foco do diálogo e mensagem associada ao campo', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Buscar NFTs' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('textbox')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await page.goto('/entrar')
  await page.getByRole('dialog').getByRole('button', { name: 'Entrar' }).click()
  const email = page.getByLabel('E-mail')
  await expect(email).toBeFocused()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAccessibleDescription('Digite um e-mail válido.')
})
