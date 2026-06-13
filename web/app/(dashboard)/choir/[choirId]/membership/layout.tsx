'use client'

import { useParams } from 'next/navigation'
import { MemberOfficeShell } from '@/components/choir/MemberOfficeShell'

export default function MembershipOfficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const choirId = String(params.choirId)

  return <MemberOfficeShell choirId={choirId}>{children}</MemberOfficeShell>
}
