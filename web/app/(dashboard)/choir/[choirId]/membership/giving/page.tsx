import { redirect } from 'next/navigation'
import { membershipProfilePath } from '@/lib/choir/membership-office'

export default function LegacyMembershipGivingPage({
  params,
  searchParams,
}: {
  params: { choirId: string }
  searchParams: { tab?: string }
}) {
  const tab = searchParams.tab === 'submit' ? 'submit' : 'giving'
  redirect(membershipProfilePath(params.choirId, tab))
}
