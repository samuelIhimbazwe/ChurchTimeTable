'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ministriesApi, type MinistrySettings } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CapabilityGate } from '@/components/shared'
import { toast } from '@/components/shared/Toast'

const FLAGS: Array<{
  key: keyof MinistrySettings
  label: string
  description: string
}> = [
  { key: 'allowDevotions', label: 'Devotions', description: 'Daily devotion and spiritual content' },
  { key: 'allowAnnouncements', label: 'Announcements', description: 'Ministry-wide announcements' },
  { key: 'allowDocuments', label: 'Documents', description: 'Policy and document library' },
  { key: 'allowMeetings', label: 'Meetings', description: 'Meeting scheduling and minutes' },
  { key: 'allowAssets', label: 'Assets', description: 'Equipment and asset tracking' },
  { key: 'allowOperationalUnits', label: 'Operational units', description: 'Teams and sub-units within ministry' },
  { key: 'allowReporting', label: 'Reporting', description: 'Ministry reports and exports' },
]

type Props = {
  ministryId: string
}

export function MinistryFeatureFlags({ ministryId }: Props) {
  const qc = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['ministry-settings', ministryId],
    queryFn: () => ministriesApi.getSettings(ministryId),
    enabled: !!ministryId,
  })

  const update = useMutation({
    mutationFn: (patch: Partial<MinistrySettings>) =>
      ministriesApi.updateSettings(ministryId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ministry-settings', ministryId] })
      toast.success('Feature settings updated')
    },
    onError: () => toast.error('Could not update settings'),
  })

  return (
    <CapabilityGate
      platformUiCapability="ministry-settings-manage"
      fallback={
        <Card padding="md">
          <CardHeader>
            <CardTitle>Feature flags</CardTitle>
            <CardDescription>Ministry module toggles</CardDescription>
          </CardHeader>
          <p className="text-sm text-text-muted">You do not have permission to manage ministry settings.</p>
        </Card>
      }
    >
      <Card padding="md">
        <CardHeader>
          <CardTitle>Feature flags</CardTitle>
          <CardDescription>
            Turn ministry modules on or off without changing roles
          </CardDescription>
        </CardHeader>

        {isLoading ? (
          <p className="text-sm text-text-muted">Loading settings…</p>
        ) : (
          <ul className="divide-y divide-border">
            {FLAGS.map((flag) => {
              const checked = settings?.[flag.key] !== false
              return (
                <li key={flag.key} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{flag.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{flag.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={checked}
                      disabled={update.isPending}
                      onChange={(e) => update.mutate({ [flag.key]: e.target.checked })}
                    />
                    <span className="w-10 h-6 bg-surface-overlay rounded-full peer peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </CapabilityGate>
  )
}
