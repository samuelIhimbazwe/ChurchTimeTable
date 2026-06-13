'use client'

import { useParams } from 'next/navigation'
import { FamilyOfficeShell } from '@/components/choir/FamilyOfficeShell'

export default function FamilyCoordinationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  return (
    <FamilyOfficeShell choirId={String(params.choirId)} kind="coordination">
      {children}
    </FamilyOfficeShell>
  )
}
