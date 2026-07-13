'use client'

import { useParams } from 'next/navigation'
import { MemberMembershipConsole } from '@/components/choir/membership/MemberMembershipConsole'

export default function MembershipProfilePage() {
  const params = useParams()
  const choirId = String(params.choirId)
  return <MemberMembershipConsole choirId={choirId} />
}
