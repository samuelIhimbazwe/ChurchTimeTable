'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { governanceApi } from '@/lib/api'
import { Card, Badge } from '@/components/shared'
import { toast } from '@/components/shared/Toast'
import { useResolvedChoirScope } from '@/lib/hooks'

type Template = {
  id: string
  name: string
  label: string
  description: string | null
  permissionCount: number
}

type Props = {
  templates: Template[]
}

export function ChoirRoleTemplateLibrary({ templates }: Props) {
  const qc = useQueryClient()
  const { choirId } = useResolvedChoirScope()

  const apply = useMutation({
    mutationFn: (templateId: string) =>
      governanceApi.applyChoirRoleTemplate(templateId, { scopeId: choirId! }),
    onSuccess: (data) => {
      toast.success('Template applied to choir')
      if (data.sodWarnings?.length) {
        toast.info('Review SoD warnings on the role you applied')
      }
      qc.invalidateQueries({ queryKey: ['choir-position-roles'] })
    },
    onError: () => toast.error('Could not apply template'),
  })

  if (!choirId || templates.length === 0) return null

  return (
    <Card padding="md">
      <p className="text-sm font-semibold text-text-primary">Role template library</p>
      <p className="text-xs text-text-muted mt-1 mb-4">
        SAP GRC-style shared templates — apply a preset permission bundle to this choir.
      </p>
      <ul className="space-y-3">
        {templates.map((template) => (
          <li
            key={template.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm text-text-primary">{template.label}</p>
              {template.description && (
                <p className="text-xs text-text-muted mt-0.5">{template.description}</p>
              )}
              <Badge variant="default">
                {template.permissionCount} permissions · {template.name}
              </Badge>
            </div>
            <button
              type="button"
              disabled={apply.isPending}
              onClick={() => apply.mutate(template.id)}
              className="text-xs font-semibold text-primary-600 hover:underline shrink-0"
            >
              Apply →
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
