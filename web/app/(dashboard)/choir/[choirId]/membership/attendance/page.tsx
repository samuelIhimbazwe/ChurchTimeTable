import { redirect } from 'next/navigation'
import { membershipProfilePath } from '@/lib/choir/membership-office'

export default function LegacyMembershipAttendancePage({
  params,
}: {
  params: { choirId: string }
}) {
  redirect(membershipProfilePath(params.choirId, 'attendance'))
}
