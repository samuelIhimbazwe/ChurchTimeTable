'use client'

import { useParams } from 'next/navigation'
import { FamilyOfficeShell } from '@/components/choir/FamilyOfficeShell'

export default function FamilyLeadershipLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const choirId = String(params.choirId)
  return (
    <FamilyOfficeShell choirId={choirId} kind="leadership">
      {children}
    </FamilyOfficeShell>
  )
}
