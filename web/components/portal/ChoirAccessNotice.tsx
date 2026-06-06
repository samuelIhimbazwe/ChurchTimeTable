'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Info, X, Clock, UserPlus, Ban } from 'lucide-react'

type Props = {
  hasPendingJoinRequest?: boolean
}

const NOTICE_COPY = {
  'choir-membership-required': (hasPendingJoinRequest: boolean) =>
    hasPendingJoinRequest
      ? {
          title: 'Choir dashboard opens after approval',
          body: 'Your join request is being reviewed. Once a choir leader approves it, return here and use Open choir dashboard on your choir.',
          icon: Clock,
          showPortalLink: true,
        }
      : {
          title: 'Choir dashboard is for approved members',
          body: 'Browse the choirs below and submit a join request. After approval, you can open the choir dashboard for rehearsals, announcements, and your role tools.',
          icon: UserPlus,
          showPortalLink: true,
        },
  'choir-unavailable': () => ({
    title: 'That choir is not available to you',
    body: 'Members belong to one primary choir. Yerusalemu (morning service) may be added as a second choir. Use the choirs listed below.',
    icon: Ban,
    showPortalLink: false,
  }),
} as const

export function ChoirAccessNotice({ hasPendingJoinRequest = false }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dismissed, setDismissed] = useState(false)

  const reason = searchParams.get('reason') as keyof typeof NOTICE_COPY | null
  const visible =
    !dismissed &&
    (reason === 'choir-membership-required' || reason === 'choir-unavailable')

  const copy = useMemo(() => {
    if (reason === 'choir-unavailable') return NOTICE_COPY['choir-unavailable']()
    return NOTICE_COPY['choir-membership-required'](hasPendingJoinRequest)
  }, [reason, hasPendingJoinRequest])

  if (!visible) return null

  const Icon = copy.icon

  function dismiss() {
    setDismissed(true)
    router.replace('/portal/choirs', { scroll: false })
  }

  return (
    <div
      role="status"
      className="flex gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-950"
    >
      <Icon size={20} className="shrink-0 mt-0.5 text-amber-700" aria-hidden />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold text-amber-950">{copy.title}</p>
        <p className="text-sm text-amber-900/90 leading-relaxed">{copy.body}</p>
        {copy.showPortalLink && (
          <p className="text-xs text-amber-800/80 flex items-center gap-1 pt-1">
            <Info size={12} aria-hidden />
            Your member portal home at{' '}
            <Link href="/portal" className="font-semibold underline underline-offset-2 hover:text-amber-950">
              /portal
            </Link>{' '}
            stays available while you wait.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 p-1 rounded-md text-amber-700 hover:bg-amber-100/80 transition-colors"
        aria-label="Dismiss notice"
      >
        <X size={18} />
      </button>
    </div>
  )
}