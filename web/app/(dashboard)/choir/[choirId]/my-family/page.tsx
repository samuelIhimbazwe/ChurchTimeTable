import { redirect } from 'next/navigation'
import { membershipOfficePath } from '@/lib/choir/membership-office'

type Props = { params: { choirId: string } }

export default function LegacyMyFamilyRedirect({ params }: Props) {
  redirect(membershipOfficePath(params.choirId, 'family'))
}
