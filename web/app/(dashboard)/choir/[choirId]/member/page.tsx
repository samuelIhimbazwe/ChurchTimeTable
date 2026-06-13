import { redirect } from 'next/navigation'
import { choirMemberHome } from '@/lib/choir/paths'

type Props = { params: { choirId: string } }

export default function LegacyMemberRedirect({ params }: Props) {
  redirect(choirMemberHome(params.choirId))
}
