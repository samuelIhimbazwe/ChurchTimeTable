'use client'

import { useParams } from 'next/navigation'
import { MemberGivingConsole } from '@/components/choir/membership/MemberGivingConsole'

export default function MembershipGivingPage() {
  const params = useParams()
  const choirId = String(params.choirId)

  return <MemberGivingConsole choirId={choirId} />
}
