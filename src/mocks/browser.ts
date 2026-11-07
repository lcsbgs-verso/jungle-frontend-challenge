import { setupWorker } from 'msw/browser'
import { handlers, resumeOrders } from './handlers'
import { startDatabase } from './store'

export async function startMocks() {
  console.log('[MSW] Starting mocks, patching fetch and WebSocket...')
  await startDatabase()
  console.log('[MSW] Database started, setting up worker...')
  const worker = setupWorker(...handlers)
  console.log('[MSW] Worker created with', handlers.length, 'handlers')
  try {
    const result = await worker.start({ onUnhandledRequest: 'bypass', quiet: false })
    console.log('[MSW] Worker started successfully:', result)
    console.log('[MSW] WebSocket constructor:', typeof WebSocket, WebSocket.name)
    resumeOrders()
    console.log('[MSW] Mocks ready, handlers active')
  } catch (error) {
    console.error('[MSW] Worker start FAILED:', error)
    throw error
  }
}
