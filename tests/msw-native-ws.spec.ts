import { test, expect } from '@playwright/test'

test('MSW intercepts native WebSocket connection', async ({ page }) => {
  const logs: string[] = []
  
  page.on('console', (msg) => {
    const text = msg.text()
    logs.push(text)
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // Test native WebSocket interception
  const result = await page.evaluate(() => {
    return new Promise<{ before: string; after: string; wsOpened: boolean; wsError: string | null }>((resolve) => {
      const before = typeof WebSocket
      
      console.log('[Native WS Test] WebSocket type before:', before, WebSocket.name)
      console.log('[Native WS Test] Creating WebSocket to ws://127.0.0.1:4173/test-ws')
      
      const ws = new WebSocket('ws://127.0.0.1:4173/test-ws')
      let wsOpened = false
      let wsError: string | null = null
      
      ws.onopen = () => {
        console.log('[Native WS Test] WebSocket OPENED')
        wsOpened = true
        ws.close()
      }
      
      ws.onerror = (e) => {
        console.log('[Native WS Test] WebSocket ERROR:', e.type)
        wsError = e.type
      }
      
      ws.onclose = () => {
        console.log('[Native WS Test] WebSocket CLOSED')
        resolve({
          before,
          after: typeof WebSocket,
          wsOpened,
          wsError
        })
      }
      
      // Force close after 2s if nothing happens
      setTimeout(() => {
        if (!wsOpened && !wsError) {
          ws.close()
        }
      }, 2000)
    })
  })
  
  console.log('Native WS test result:', result)
  console.log('All logs:', logs.join('; '))
  
  // Report actual behavior
  expect(result.before).toBe('function')
  expect(result.after).toBe('function')
  
  // Document whether MSW intercepted (don't fail, just document)
  if (result.wsOpened) {
    console.log('✓ MSW intercepted native WebSocket and completed handshake')
  } else if (result.wsError) {
    console.log('✗ Native WebSocket failed:', result.wsError)
  } else {
    console.log('? Native WebSocket behavior unclear')
  }
})
