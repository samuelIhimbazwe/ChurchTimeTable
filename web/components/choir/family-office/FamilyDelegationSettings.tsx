'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { familiesApi } from '@/lib/api'
import { Card } from '@/components/shared'
import { toast } from '@/components/shared/Toast'

type Props = {
  familyId: string
  delegationEnabled: boolean
}

export function FamilyDelegationSettings({ familyId, delegationEnabled }: Props) {
  const qc = useQueryClient()

  const update = useMutation({
    mutationFn: (enabled: boolean) =>
      familiesApi.updateDelegation(familyId, enabled),
    onSuccess: (_data, enabled) => {
      toast.success(
        enabled
          ? 'Deputy can now confirm contributions'
          : 'Deputy approval turned off',
      )
      qc.invalidateQueries({ queryKey: ['family-detail', familyId] })
      qc.invalidateQueries({ queryKey: ['family-leadership-context'] })
      qc.invalidateQueries({ queryKey: ['family-contribution-dashboard', familyId] })
    },
    onError: (err: Error) => toast.error('Could not update delegation', err.message),
  })

  return (
    <Card padding="md">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Deputy approval
      </p>
      <p className="text-sm text-text-secondary mb-4">
        When enabled, your assistant family head can confirm member payments in the
        decision console. When off, all confirmations stay with you.
      </p>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={delegationEnabled}
          disabled={update.isPending}
          onChange={(e) => update.mutate(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border"
        />
        <span className="text-sm">
          <span className="font-semibold text-text-primary block">
            Allow deputy to confirm payments
          </span>
          <span className="text-text-muted">
            Your deputy is notified when this setting changes.
          </span>
        </span>
      </label>
    </Card>
  )
}
