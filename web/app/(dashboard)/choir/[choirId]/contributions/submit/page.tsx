import { redirect } from 'next/navigation'
import { membershipProfilePath } from '@/lib/choir/membership-office'

type Props = { params: { choirId: string } }

export default function LegacyContributionsSubmitRedirect({ params }: Props) {
  redirect(membershipProfilePath(params.choirId, 'submit'))
}
