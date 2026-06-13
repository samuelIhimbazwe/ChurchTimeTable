'use client'

import { ContributionQuickActionPage } from '@/components/choir/family-office/ContributionQuickActionPage'
import { useParams } from 'next/navigation'

export default function Page() {
  const params = useParams()
  const choirId = String(params.choirId)
  return <ContributionQuickActionPage choirId={choirId} />
}
