import { expect, test } from '@playwright/test'
import { act, addEmerald, checkout, fillLogin, login } from './helpers'

test('cadastro, conflito, logout e troca de usuário isolada', async ({ page }) => {
  await page.goto('/cadastro?next=%2Fperfil')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nome completo').fill('Colecionador de Teste')
  await dialog.getByLabel('E-mail').fill('alice@kurio.test')
  await dialog.getByLabel('Senha', { exact: true }).fill('Exemplo2026!')
  await dialog.getByLabel('Confirme sua senha').fill('Exemplo2026!')
  await dialog.getByRole('button', { name: 'Criar conta' }).click()
  await expect(dialog.getByText('Este e-mail já está cadastrado.').first()).toBeVisible()
  await dialog.getByLabel('E-mail').fill('colecionador@kurio.test')
  await dialog.getByRole('button', { name: 'Criar conta' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page).toHaveURL('/perfil')
  await expect(page.getByLabel('Nome completo')).toHaveValue('Colecionador de Teste')
  await addEmerald(page)
  const mobileMenu = page.getByRole('button', { name: 'Abrir menu' })
  if (await mobileMenu.isVisible()) await mobileMenu.click()
  else await page.getByRole('button', { name: 'Colecionador', exact: true }).click()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL('/')
  await login(page, '/carrinho', 'bruno@kurio.test')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('sessão expirada preserva contexto e rascunho do checkout', async ({ page }) => {
  await checkout(page)
  await page.getByLabel('Telefone').fill('(11) 98888-9999')
  await act(page, { type: 'scenario', scenario: 'expired' })
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('dialog', { name: 'Entre na sua conta' })).toBeVisible()
  await expect(page).toHaveURL(/\/entrar\?next=%2Fpagamento/)
  await fillLogin(page)
  await expect(page.getByLabel('Telefone')).toHaveValue('(11) 98888-9999')
  await expect(page.getByRole('region', { name: 'Resumo do pedido' })).toContainText(
    'Emerald Ape #042',
  )
})

test('favoritos persistem com reversão após falha e isolamento entre contas', async ({ page }) => {
  await login(page, '/nft/emerald-ape')
  const favorite = page.getByRole('button', { name: 'Adicionar aos favoritos' })
  await act(page, { type: 'scenario', scenario: 'favoriteFailure' })
  await favorite.click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível salvar o favorito')
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
  await act(page, { type: 'scenario', scenario: 'default' })
  await favorite.click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.reload()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await login(page, '/nft/emerald-ape', 'bruno@kurio.test')
  await expect(favorite).toHaveAttribute('aria-pressed', 'false')
})

test('edição de perfil, avatar, senha e carteiras com validação e persistência', async ({
  page,
}) => {
  await login(page, '/perfil')
  await page.getByLabel('Nome completo').fill('Alice Editada')
  await page.getByLabel('E-mail').fill('bruno@kurio.test')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByRole('alert')).toContainText('Este e-mail já está cadastrado')
  await page.getByLabel('E-mail').fill('alice@kurio.test')
  await page.getByLabel('Alterar avatar').setInputFiles('public/art/0.webp')
  await expect(page.getByRole('img', { name: 'Prévia do avatar' })).toBeVisible()
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByText('Perfil atualizado.')).toBeVisible()
  await page.getByLabel('Senha atual').fill('incorreta')
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha2026!')
  await page.getByLabel('Confirme a nova senha').fill('NovaSenha2026!')
  await page.getByRole('button', { name: 'Alterar senha' }).click()
  await expect(page.getByLabel('Senha atual')).toHaveAccessibleDescription('Senha atual incorreta.')
  await page.getByLabel('Senha atual').fill('Kurio2026!')
  await page.getByRole('button', { name: 'Alterar senha' }).click()
  await expect(page.getByText('Senha alterada.')).toBeVisible()
  await login(page, '/perfil', 'alice@kurio.test', 'NovaSenha2026!')
  await expect(page.getByLabel('Nome completo')).toHaveValue('Alice Editada')
  await expect(page.getByRole('img', { name: 'Prévia do avatar' })).toBeVisible()

  await page.goto('/carteiras')
  const primary = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Carteira principal' }) })
  await primary.getByLabel('Endereço da carteira').fill('invalido')
  await primary.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(primary.getByLabel('Endereço da carteira')).toHaveAttribute('aria-invalid', 'true')
  await primary.getByLabel('Endereço da carteira').fill('0x' + 'c'.repeat(40))
  await primary.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(primary.getByText('Carteira salva.')).toBeVisible()
  await page.reload()
  await expect(primary.getByLabel('Endereço da carteira')).toHaveValue('0x' + 'c'.repeat(40))
})

test('falta de permissão nos favoritos apresenta erro e permite recuperação', async ({ page }) => {
  await login(page, '/nft/emerald-ape')
  await act(page, { type: 'scenario', scenario: 'forbidden' })
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Esta conta não tem permissão')
  await act(page, { type: 'scenario', scenario: 'default' })
  await page.getByRole('button', { name: 'Tentar carregar favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeEnabled()
})
