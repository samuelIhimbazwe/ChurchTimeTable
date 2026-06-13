'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { choirApi, governanceApi } from '@/lib/api'
import { ChoirSodWarningsPanel } from '@/components/choir/committee/ChoirSodWarningsPanel'
import { ChoirRoleTemplateLibrary } from '@/components/choir/committee/ChoirRoleTemplateLibrary'
import { AdvisorElevationPanel } from '@/components/choir/committee/AdvisorElevationPanel'
import { useResolvedChoirScope } from '@/lib/hooks'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, CardDescription,
  SkeletonCard, Badge,
} from '@/components/shared'
import {
  CHOIR_POSITION_PERMISSION_OPTIONS,
  choirPositionLabel,
  choirPositionMeta,
} from '@/lib/constants/choir-positions'
import { ChoirPositionGuide } from '@/components/choir/ChoirPositionGuide'
import { KeyRound, Plus, Save } from 'lucide-react'
import type { ChoirPositionRole } from '@/lib/api/modules/choir'

function parsePermissions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((p) => typeof p === 'string')
  return []
}

export default function ChoirRolesPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<ChoirPositionRole | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])

  const { choirId, choirName } = useResolvedChoirScope()

  const { data: roles, isLoading } = useQuery({
    queryKey: ['choir-position-roles', choirId],
    queryFn: () => choirApi.getPositionRoles(choirId),
    enabled: !!choirId,
  })

  const { data: templateData } = useQuery({
    queryKey: ['choir-role-templates'],
    queryFn: () => governanceApi.listChoirRoleTemplates(),
    enabled: !!choirId,
  })

  const save = useMutation({
    mutationFn: () => {
      if (!choirId || !name.trim()) throw new Error('Missing choir or role name')
      const key = name.trim().toLowerCase().replace(/\s+/g, '_')
      return governanceApi.upsertChoirRole({
        scopeId: choirId,
        name: key,
        permissions,
      })
    },
    onSuccess: (data) => {
      toast.success('Position role saved')
      if (data.sodWarnings?.length) {
        toast.info('SoD review: see warnings on this role')
      }
      qc.invalidateQueries({ queryKey: ['choir-position-roles'] })
      setEditing(null)
      setCreating(false)
      setName('')
      setPermissions([])
    },
    onError: () => toast.error('Could not save role'),
  })

  const openEdit = (role: ChoirPositionRole) => {
    setEditing(role)
    setCreating(false)
    setName(role.name)
    setPermissions(parsePermissions(role.permissionsJson))
  }

  const openCreate = () => {
    setCreating(true)
    setEditing(null)
    setName('')
    setPermissions(['event:read', 'member.portal.view'])
  }

  const togglePermission = (code: string) => {
    setPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    )
  }

  const showForm = creating || editing

  const { data: sodCheck } = useQuery({
    queryKey: ['choir-sod-check', name, permissions],
    queryFn: () => governanceApi.checkChoirSod(permissions, name.trim()),
    enabled: showForm && name.trim().length > 0,
  })

  const sodWarnings = sodCheck?.warnings ?? []
  const hasHighSod = sodWarnings.some((w) => w.severity === 'high')

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Position roles</h2>
          <p className="text-text-secondary text-sm mt-1">
            {choirName
              ? `Positions for ${choirName} — assign when approving joins or updating members.`
              : 'Define choir leadership positions and their access.'}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 shrink-0"
        >
          <Plus size={15} /> Add role
        </button>
      </div>

      {showForm && (
        <Card padding="md" accent="gold">
          <CardHeader className="p-0 mb-4">
            <CardTitle>{editing ? 'Edit position' : 'New position'}</CardTitle>
            <CardDescription>
              Use lowercase keys like <code className="text-xs">president</code> or{' '}
              <code className="text-xs">music_director</code>
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Role key (e.g. president)"
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
            />
            <div>
              <p className="text-xs font-semibold text-text-primary mb-2">Permissions</p>
              <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {CHOIR_POSITION_PERMISSION_OPTIONS.map((opt) => (
                  <label
                    key={opt.code}
                    className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(opt.code)}
                      onChange={() => togglePermission(opt.code)}
                      className="rounded border-border"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <ChoirSodWarningsPanel warnings={sodWarnings} />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setEditing(null); setCreating(false) }}
                className="px-3 py-2 text-sm border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={save.isPending || !name.trim() || hasHighSod}
                onClick={() => save.mutate()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
              >
                <Save size={14} />
                {save.isPending ? 'Saving…' : 'Save role'}
              </button>
            </div>
          </div>
        </Card>
      )}

      <ChoirRoleTemplateLibrary templates={templateData?.templates ?? []} />
      <AdvisorElevationPanel />

      {isLoading ? (
        <SkeletonCard rows={6} />
      ) : (
        <div className="space-y-3">
          {roles?.map((role) => {
            const perms = parsePermissions(role.permissionsJson)
            const meta = choirPositionMeta(role.name)
            return (
              <Card key={role.id} padding="md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <KeyRound size={16} className="text-primary-600" />
                      <p className="font-semibold text-text-primary">
                        {choirPositionLabel(role.name)}
                      </p>
                      <Badge variant="default">{role.name}</Badge>
                    </div>
                    {meta && (
                      <p className="text-sm text-text-secondary mt-2">{meta.summary}</p>
                    )}
                    <p className="text-xs text-text-muted mt-2">
                      {perms.length} permission{perms.length === 1 ? '' : 's'} configured
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(role)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-800 shrink-0"
                  >
                    Edit access
                  </button>
                </div>
                {meta && (
                  <div className="mt-4">
                    <ChoirPositionGuide roleKey={role.name} />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
