'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import ToastContainer from '@/components/shared/Toast'
import { AuthSessionRestore } from '@/components/auth/AuthSessionRestore'
import { ClientAppearance } from '@/components/auth/ClientAppearance'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries:   { retry: 1, refetchOnWindowFocus: false },
        mutations: { retry: 0 },
      },
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ClientAppearance />
      <AuthSessionRestore />
      {children}
      <ToastContainer />
    </QueryClientProvider>
  )
}
