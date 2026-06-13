'use client'

import { MemberLeadershipOfficePage } from '@/components/choir/membership/MemberLeadershipOfficePage'
import { useParams } from 'next/navigation'

export default function Page() {
  const params = useParams()
  const choirId = String(params.choirId)
  return <MemberLeadershipOfficePage choirId={choirId} />
}
