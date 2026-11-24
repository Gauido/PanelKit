import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfirmHost, Toaster } from '@panelkit/blocks'
import { App } from './App'
import './index.css'
import '@fontsource-variable/geist'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/manrope'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/outfit'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
      <ConfirmHost />
    </QueryClientProvider>
  </StrictMode>,
)
