'use client'

import { useAuthStore } from '@/stores'
import Shell from '@/components/layout/Shell'
import { usePageTitle, useTranslations } from '@/lib/i18n'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAuthStore((s) => s.user)
  const pageTitle = usePageTitle('CMMS')
  const { translateRole } = useTranslations()

  return (
    <Shell
      pageTitle={pageTitle}
      role={user?.role ?? 'MEMBER'}
      userName={user?.name ?? translateRole('MEMBER')}
      userRole={translateRole(user?.role?.replace(/_/g, ' '))}
    >
      {children}
    </Shell>
  )
}
