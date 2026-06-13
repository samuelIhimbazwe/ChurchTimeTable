'use client'

import { useParams } from 'next/navigation'
import { MemberWeekHome } from '@/components/choir/membership/MemberWeekHome'

export default function MembershipHomePage() {
  const params = useParams()
  const choirId = String(params.choirId)
  return <MemberWeekHome choirId={choirId} />
}
