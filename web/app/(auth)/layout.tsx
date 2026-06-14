import { Suspense } from 'react'
import { AuthAppearanceBar } from '@/components/auth/AppearanceControls'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={null}>
      <AuthAppearanceBar />
      {children}
    </Suspense>
  )
}
