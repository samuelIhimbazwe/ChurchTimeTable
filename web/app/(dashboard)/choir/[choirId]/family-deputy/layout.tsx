'use client'

import { useParams } from 'next/navigation'
import { FamilyOfficeShell } from '@/components/choir/FamilyOfficeShell'

export default function FamilyDeputyLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  return (
    <FamilyOfficeShell choirId={String(params.choirId)} kind="deputy">
      {children}
    </FamilyOfficeShell>
  )
}
