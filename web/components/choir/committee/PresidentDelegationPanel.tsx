'use client'

import { Card } from '@/components/shared'
import { useResolvedChoirId } from '@/lib/hooks'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'

export function PresidentDelegationPanel() {
  const qc = useQueryClient()
  const choirId = useResolvedChoirId()

  const { data, isLoading } = useQuery({
    queryKey: ['president-delegation', choirId],
    queryFn: () => choirApi.getPresidentDelegation(choirId!),
    enabled: !!choirId,
  })

  const update = useMutation({
    mutationFn: (payload: { presidentOutOfOffice?: boolean }) =>
      choirApi.updatePresidentDelegation(choirId!, payload),
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
        When you are away, flag out-of-office so the vice president sees escalation cues.
        Membership intake stays with admin onboarding; treasury verification stays with the treasurer.
      </p>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={data.presidentOutOfOffice}
          disabled={update.isPending}
          onChange={(e) => update.mutate({ presidentOutOfOffice: e.target.checked })}
          className="mt-1"
        />
        <span>
          <span className="text-sm font-medium block">President out of office</span>
          <span className="text-xs text-text-muted">
            Shows escalation cues to the VP on the command home.
          </span>
        </span>
      </label>
    </Card>
  )
}
