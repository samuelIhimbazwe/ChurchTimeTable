import { redirect } from 'next/navigation'
import { membershipOfficePath } from '@/lib/choir/membership-office'

type Props = { params: { choirId: string } }

export default function LegacyContributionsSubmitRedirect({ params }: Props) {
  redirect(`${membershipOfficePath(params.choirId, 'giving')}?tab=submit`)
}
