import { setupWorker } from 'msw/browser'
import { handlers, resumeOrders } from './handlers'
import { startDatabase } from './store'

export async function startMocks() {
  await startDatabase()
  const worker = setupWorker(...handlers)
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  resumeOrders()
}
