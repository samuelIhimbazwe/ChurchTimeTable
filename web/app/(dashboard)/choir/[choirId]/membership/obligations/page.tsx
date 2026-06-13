'use client'

import { MemberObligationQueue } from '@/components/choir/membership/MemberObligationQueue'
import { useParams } from 'next/navigation'

export default function MembershipObligationsPage() {
  const params = useParams()
  const choirId = String(params.choirId)
  return <MemberObligationQueue choirId={choirId} />
}
