import { redirect } from 'next/navigation'
import { membershipProfilePath } from '@/lib/choir/membership-office'

export default function LegacyMembershipFamilyPage({
  params,
}: {
  params: { choirId: string }
}) {
  redirect(membershipProfilePath(params.choirId, 'family'))
}
