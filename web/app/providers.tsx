'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import ToastContainer from '@/components/shared/Toast'
import { AuthSessionRestore } from '@/components/auth/AuthSessionRestore'

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
      <AuthSessionRestore />
      {children}
      <ToastContainer />
    </QueryClientProvider>
  )
}
