'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'
import { useResolvedChoirId } from '@/lib/hooks'

export function PresidentDelegationPanel() {
  const qc = useQueryClient()
  const choirId = useResolvedChoirId()

  const { data, isLoading } = useQuery({
    queryKey: ['president-delegation', choirId],
    queryFn: () => choirApi.getPresidentDelegation(choirId!),
    enabled: !!choirId,
  })

  const update = useMutation({
    mutationFn: (payload: {
      presidentOutOfOffice?: boolean
      presidentDelegationJoinReview?: boolean
    }) => choirApi.updatePresidentDelegation(choirId!, payload),
    onSuccess: () => {
      toast.success('Delegation settings updated')
      qc.invalidateQueries({ queryKey: ['president-delegation'] })
      qc.invalidateQueries({ queryKey: ['choir-dashboard-context'] })
    },
    onError: (err: Error) => toast.error('Could not update settings', err.message),
  })

  if (!choirId) return null

  if (isLoading || !data) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted">Loading delegation settings…</p>
      </Card>
    )
  }

  return (
    <Card padding="md" accent="gold">
      <p className="font-semibold text-text-primary mb-1">VP delegation</p>
      <p className="text-xs text-text-muted mb-4">
        When you are away, delegate join-request decisions to the vice president. Money and
        treasury verification stay with the treasurer.
      </p>
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.presidentOutOfOffice}
            disabled={update.isPending}
            onChange={(e) =>
              update.mutate({ presidentOutOfOffice: e.target.checked })
            }
            className="mt-1"
          />
          <span>
            <span className="text-sm font-medium block">President out of office</span>
            <span className="text-xs text-text-muted">
              Shows escalation cues to the VP on the command home.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.presidentDelegationJoinReview}
            disabled={update.isPending}
            onChange={(e) =>
              update.mutate({ presidentDelegationJoinReview: e.target.checked })
            }
            className="mt-1"
          />
          <span>
            <span className="text-sm font-medium block">Delegate join decisions to VP</span>
            <span className="text-xs text-text-muted">
              VP can approve, reject, or request info from the decision console.
            </span>
          </span>
        </label>
      </div>
    </Card>
  )
}
