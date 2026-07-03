'use client'

import { PageContainer } from '@/components/shared'

type Props = {
  children: React.ReactNode
}

export function ProtocolScheduleShell({ children }: Props) {
  return (
    <PageContainer max="5xl">
      <div className="space-y-2 pb-28 sm:pb-24">{children}</div>
    </PageContainer>
  )
}
