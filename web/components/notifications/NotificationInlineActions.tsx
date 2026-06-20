'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { choirSchedulingApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import type { ApiNotification } from '@/types'
import { linkFromNotificationData } from '@/lib/notifications/links'

type Props = {
  notification: ApiNotification
  onAction?: () => void
  compact?: boolean
}

export function NotificationInlineActions({ notification, onAction, compact }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const kind = String(notification.data?.kind ?? '')
  const link = notification.link ?? linkFromNotificationData(notification.data)
  const assignmentId = notification.data?.assignmentId
    ? String(notification.data.assignmentId)
    : undefined

  const accept = useMutation({
    mutationFn: (id: string) => choirSchedulingApi.acceptAssignment(id),
    onSuccess: () => {
      toast.success('Assignment accepted')
      qc.invalidateQueries({ queryKey: ['choir-assignments'] })
      qc.invalidateQueries({ queryKey: ['choir-pending-acceptance'] })
      onAction?.()
    },
    onError: () => toast.error('Could not accept assignment'),
  })

  const btnClass = compact
    ? 'px-2 py-1 text-[10px] font-semibold rounded-md border border-border hover:bg-surface-raised'
    : 'px-2.5 py-1 text-xs font-semibold rounded-md border border-border hover:bg-surface-raised'

  if (kind === 'choir_assignment_pending_acceptance' && assignmentId) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          disabled={accept.isPending}
          onClick={() => accept.mutate(assignmentId)}
          className={`${btnClass} bg-success text-white border-success`}
        >
          Accept
        </button>
        {link && (
          <Link href={link} className={`${btnClass} text-primary-600`} onClick={onAction}>
            Review
          </Link>
        )}
      </div>
    )
  }

  if (
    kind === 'choir_join_request_admin' ||
    kind === 'choir_join_review' ||
    kind === 'join_request'
  ) {
    if (!link) return null
    return (
      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`${btnClass} text-primary-600`}
          onClick={() => {
            onAction?.()
            router.push(link)
          }}
        >
          Review request
        </button>
      </div>
    )
  }

  if (kind === 'contribution_family_approve' && link) {
    return (
      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
        <Link href={link} className={`${btnClass} text-primary-600`} onClick={onAction}>
          Review payment
        </Link>
      </div>
    )
  }

  return null
}
