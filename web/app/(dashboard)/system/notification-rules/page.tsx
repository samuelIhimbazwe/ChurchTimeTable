'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pilotApi } from '@/lib/api'
import { Card, Badge } from '@/components/shared'
import { toast } from '@/components/shared/Toast'

function triggerLabel(trigger: string) {
  return trigger.replace(/_/g, ' ')
}

export default function NotificationRulesPage() {
  const qc = useQueryClient()

  const { data: rules, isLoading } = useQuery({
    queryKey: ['notification-rules'],
    queryFn: () => pilotApi.listNotificationRules(),
  })

  const update = useMutation({
    mutationFn: (payload: { trigger: string; enabled: boolean }) =>
      pilotApi.updateNotificationRule(payload.trigger, { enabled: payload.enabled }),
    onSuccess: () => {
      toast.success('Notification rule updated')
      qc.invalidateQueries({ queryKey: ['notification-rules'] })
    },
    onError: () => toast.error('Could not update rule'),
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Notification rules</h2>
        <p className="text-text-secondary text-sm mt-1">
          Toggle workflow-linked in-app notifications for contributions, events, and reminders.
        </p>
      </div>

      {isLoading ? (
        <Card padding="md">
          <p className="text-sm text-text-muted">Loading rules…</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {(rules ?? []).map((rule) => (
            <li key={rule.trigger}>
              <Card padding="md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-text-primary capitalize">
                      {triggerLabel(rule.trigger)}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Channel: {rule.channel}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={rule.enabled ? 'status-approved' : 'default'}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <button
                      type="button"
                      disabled={update.isPending}
                      onClick={() =>
                        update.mutate({
                          trigger: rule.trigger,
                          enabled: !rule.enabled,
                        })
                      }
                      className="text-xs font-semibold text-primary-600 hover:underline"
                    >
                      {rule.enabled ? 'Turn off' : 'Turn on'}
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
