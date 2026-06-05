'use client'

import { useAuthStore } from '@/stores'
import Shell from '@/components/layout/Shell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAuthStore((s) => s.user)

  return (
    <Shell
      pageTitle="CMMS"
      role={user?.role ?? 'MEMBER'}
      userName={user?.name ?? 'Member'}
      userRole={user?.role?.replace(/_/g, ' ') ?? 'Member'}
    >
      {children}
    </Shell>
  )
}
