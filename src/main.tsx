import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { mocksEnabled } from './api'
import { router } from './router'
import { queryClient } from './state'
import './styles.css'

const root = createRoot(document.getElementById('root')!)

async function start() {
  if (mocksEnabled) {
    const { startMocks } = await import('./mocks/browser')
    await startMocks()
  }
  root.render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>)
}

root.render(<main className="startup"><div className="skeleton" aria-hidden="true" /><p role="status">Carregando Kurio…</p></main>)
void start().catch((error: unknown) => {
  console.error(error)
  root.render(<main className="startup"><h1>Não foi possível iniciar a demonstração.</h1><button type="button" onClick={() => location.reload()}>Tentar novamente</button></main>)
})
