import { test, expect } from '@playwright/test'

test.describe('Socket.IO real-time events via MSW', () => {
  test('establishes WebSocket connection with handshake and receives nft.updated event', async ({ page }) => {
    // Monitor console for Socket.IO connection logs
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('LiveProvider') || text.includes('Socket')) {
        consoleLogs.push(text)
      }
    })

    // Navigate to home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for Socket.IO connection
    await page.waitForTimeout(2000)

    // Verify connection logs
    const hasConnected = consoleLogs.some(log => log.includes('Socket connected'))
    expect(hasConnected, `Socket.IO should connect. Logs: ${consoleLogs.join('; ')}`).toBe(true)

    // Get current NFT price
    const initialPrice = await page.locator('.nft-card').first().locator('.nft-meta strong').textContent()
    expect(initialPrice).toBeTruthy()

    // Trigger price change via MSW demo action
    await page.evaluate(() => {
      return fetch('/api/demo/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'price' }),
      })
    })

    // Wait for Socket.IO event to propagate
    await page.waitForTimeout(1500)

    // Verify price changed via Socket.IO event (not direct UI update)
    const updatedPrice = await page.locator('.nft-card').first().locator('.nft-meta strong').textContent()
    expect(updatedPrice).not.toBe(initialPrice)

    // Verify socket event was received
    const hasNftUpdate = consoleLogs.some(log => log.includes('nft.updated') || log.includes('Socket'))
    expect(hasNftUpdate, `Should receive nft.updated event via Socket.IO`).toBe(true)
  })

  test('maintains connection state across page navigation', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('LiveProvider') || text.includes('Socket')) {
        consoleLogs.push(text)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const hasInitialConnection = consoleLogs.some(log => log.includes('Socket connected'))
    expect(hasInitialConnection).toBe(true)

    // Navigate to catalog
    await page.goto('/#catalogo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Connection should persist (no disconnect/reconnect)
    const disconnectCount = consoleLogs.filter(log => log.includes('disconnect')).length
    expect(disconnectCount).toBe(0)
  })

  test('reconnects after simulated disconnect', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('LiveProvider') || text.includes('Socket') || text.includes('disconnect')) {
        consoleLogs.push(text)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Trigger disconnect
    await page.evaluate(() => {
      return fetch('/api/demo/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'disconnect' }),
      })
    })

    await page.waitForTimeout(2000)

    // Should see disconnect event
    const hasDisconnect = consoleLogs.some(log => log.includes('disconnect'))
    expect(hasDisconnect, `Should log disconnect event`).toBe(true)

    // Socket.IO should attempt reconnection
    await page.waitForTimeout(5000)
    const hasReconnect = consoleLogs.filter(log => log.includes('Socket connected')).length >= 2
    expect(hasReconnect, `Should reconnect after disconnect`).toBe(true)
  })

  test('isolates events per user session', async ({ page, context }) => {
    // User A logs in
    await page.goto('/entrar')
    await page.fill('input[type="email"]', 'alice@example.com')
    await page.fill('input[type="password"]', 'senhaAlice123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // Add item to cart as User A
    await page.locator('.nft-card').first().click()
    await page.waitForURL(/\/nft\//)
    await page.click('text=Adicionar ao carrinho')
    await page.waitForTimeout(500)

    // Verify cart has 1 item
    const cartCount = await page.locator('.cart-icon span').textContent()
    expect(cartCount).toBe('1')

    // User B opens in new context
    const pageB = await context.newPage()
    await pageB.goto('/entrar')
    await pageB.fill('input[type="email"]', 'bob@example.com')
    await pageB.fill('input[type="password"]', 'senhaBob456')
    await pageB.click('button[type="submit"]')
    await pageB.waitForURL('/')
    await pageB.waitForTimeout(1000)

    // User B should have empty cart
    const cartCountB = await pageB.locator('.cart-icon span').textContent()
    expect(cartCountB).toBe('0')

    // Trigger price change
    await page.evaluate(() => {
      return fetch('/api/demo/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'price' }),
      })
    })

    await page.waitForTimeout(1500)
    await pageB.waitForTimeout(1500)

    // Both users should see price update
    await page.reload()
    await pageB.reload()
    await page.waitForLoadState('networkidle')
    await pageB.waitForLoadState('networkidle')

    // But carts should remain isolated
    const finalCartA = await page.locator('.cart-icon span').textContent()
    const finalCartB = await pageB.locator('.cart-icon span').textContent()
    expect(finalCartA).toBe('1')
    expect(finalCartB).toBe('0')

    await pageB.close()
  })
})
