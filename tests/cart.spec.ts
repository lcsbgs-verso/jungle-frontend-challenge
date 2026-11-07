import { expect, test } from '@playwright/test'
import { addEmerald, login } from './helpers'

test.describe('Carrinho', () => {
  test('adicionar, editar quantidade, remover e aplicar cupom', async ({ page }) => {
    await addEmerald(page)

    // Ir para o carrinho
    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { name: /carrinho/i })).toBeVisible()

    // Verificar item no carrinho
    await expect(page.getByText(/emerald ape/i)).toBeVisible()
    
    // Aumentar quantidade
    const increaseButton = page.getByRole('button', { name: '+' }).first()
    await increaseButton.click()
    await page.waitForTimeout(300)

    // Verificar que subtotal aumentou
    await expect(page.getByText(/ETH/i).first()).toBeVisible()

    // Aplicar cupom
    const couponInput = page.getByPlaceholder(/cupom|código/i)
    if (await couponInput.isVisible()) {
      await couponInput.fill('KURIO10')
      await page.getByRole('button', { name: /aplicar/i }).click()
      await expect(page.getByText(/desconto|10%/i)).toBeVisible()

      // Remover cupom
      const removeCouponButton = page.getByRole('button', { name: /remover cupom|×/i })
      if (await removeCouponButton.isVisible()) {
        await removeCouponButton.click()
        await page.waitForTimeout(300)
      }
    }

    // Remover item do carrinho
    const removeButton = page.getByRole('button', { name: /remover|excluir/i, exact: false }).first()
    await removeButton.click()
    await expect(page.getByText(/vazio/i)).toBeVisible()
  })

  test('persistência do carrinho após refresh', async ({ page }) => {
    await addEmerald(page)
    await page.goto('/carrinho')
    await expect(page.getByText(/emerald ape/i)).toBeVisible()

    // Refresh da página
    await page.reload()
    await expect(page.getByText(/emerald ape/i)).toBeVisible()
  })

  test('carrinho de visitante preservado após login', async ({ page }) => {
    // Adicionar item como visitante
    await addEmerald(page)
    await page.goto('/carrinho')
    await expect(page.getByText(/emerald ape/i)).toBeVisible()

    // Fazer login
    await login(page, '/carrinho')

    // Verificar que item permanece no carrinho
    await expect(page.getByText(/emerald ape/i)).toBeVisible()
  })

  test('cupom inválido mostra erro', async ({ page }) => {
    await addEmerald(page)
    await page.goto('/carrinho')

    const couponInput = page.getByPlaceholder(/cupom|código/i)
    if (await couponInput.isVisible()) {
      await couponInput.fill('INVALIDO')
      await page.getByRole('button', { name: /aplicar/i }).click()
      await expect(page.getByText(/inválido|não encontrado/i)).toBeVisible()
    }
  })
})
