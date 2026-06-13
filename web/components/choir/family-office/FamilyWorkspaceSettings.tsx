'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { familiesApi } from '@/lib/api'
import { Card } from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import {
  FAMILY_WORKSPACE_TEMPLATES,
  type FamilyWorkspaceTemplate,
  resolveWorkspaceTemplate,
} from '@/lib/choir/family-workspace-templates'

type Props = {
  familyId: string
  workspaceTemplate?: string | null
}

export function FamilyWorkspaceSettings({ familyId, workspaceTemplate }: Props) {
  const qc = useQueryClient()
  const current = resolveWorkspaceTemplate(workspaceTemplate)

  const update = useMutation({
    mutationFn: (template: FamilyWorkspaceTemplate) =>
      familiesApi.updateWorkspaceTemplate(familyId, template),
    onSuccess: () => {
      toast.success('Workspace layout updated')
      qc.invalidateQueries({ queryKey: ['family-detail', familyId] })
    },
    onError: (err: Error) => toast.error('Could not update workspace', err.message),
  })

  return (
    <Card padding="md">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Command workspace
      </p>
      <p className="text-sm text-text-secondary mb-4">
        Choose how your family command home prioritizes decisions, goals, and team
        health. Secretary coordination follows the same template.
      </p>
      <div className="space-y-2">
        {(Object.keys(FAMILY_WORKSPACE_TEMPLATES) as FamilyWorkspaceTemplate[]).map(
          (key) => {
            const template = FAMILY_WORKSPACE_TEMPLATES[key]
            const selected = current === key
            return (
              <label
                key={key}
                className={`flex items-start gap-3 rounded-lg border px-3 py-3 cursor-pointer transition-colors ${
                  selected
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-border hover:bg-surface-raised'
                }`}
              >
                <input
                  type="radio"
                  name="workspaceTemplate"
                  checked={selected}
                  disabled={update.isPending}
                  onChange={() => {
                    if (!selected) update.mutate(key)
                  }}
                  className="mt-1 h-4 w-4"
                />
                <span className="text-sm">
                  <span className="font-semibold text-text-primary block">
                    {template.label}
                  </span>
                  <span className="text-text-muted">{template.description}</span>
                </span>
              </label>
            )
          },
        )}
      </div>
    </Card>
  )
}
