'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { choirServiceOpsApi, musicApi } from '@/lib/api'
import type { ServicePreparationItem, ServicePreparationItemType, PepTalkTiming } from '@/lib/api/modules/choirServiceOps'
import { useResolvedChoirScope } from '@/lib/hooks'
import { toast } from '@/components/shared/Toast'
import { Card, PermissionGate, SkeletonCard } from '@/components/shared'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { formatDate, formatTime } from '@/lib/utils/format'
import { ArrowLeft } from 'lucide-react'

const ITEM_TYPES: Array<{ value: ServicePreparationItemType; label: string }> = [
  { value: 'SERVICE_SONG', label: 'Service song' },
  { value: 'UNIFORM', label: 'Uniform note' },
  { value: 'PEP_TALK', label: 'Pep talk / meeting' },
  { value: 'SHORT_ANNOUNCEMENT', label: 'Short announcement' },
  { value: 'CUSTOM', label: 'Custom item' },
]

export default function ServicePreparationDetailPage() {
  const { occurrenceId } = useParams<{ occurrenceId: string }>()
  const { choirId, choirLink } = useResolvedChoirScope()
  const choirCtx = useOptionalChoirDashboardCtx()
  const qc = useQueryClient()
  const isActiveMember = choirCtx?.context?.membership?.isActive === true

  const { data: plan, isLoading } = useQuery({
    queryKey: ['service-preparation', choirId, occurrenceId, isActiveMember],
    queryFn: () =>
      isActiveMember
        ? choirServiceOpsApi.getMemberPreparation(choirId!, occurrenceId)
        : choirServiceOpsApi.getPreparation(choirId!, occurrenceId),
    enabled: !!choirId && !!occurrenceId,
  })

  const { data: songs } = useQuery({
    queryKey: ['prep-songs'],
    queryFn: () => musicApi.getSongs({ limit: 100 }),
  })

  const [uniformNotes, setUniformNotes] = useState('')
  const [pepTalkTitle, setPepTalkTitle] = useState('')
  const [pepTalkAt, setPepTalkAt] = useState('')
  const [pepTalkTiming, setPepTalkTiming] = useState<PepTalkTiming | ''>('')
  const [items, setItems] = useState<ServicePreparationItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!plan || hydrated) return
    setUniformNotes(plan.uniformNotes ?? '')
    setPepTalkTitle(plan.pepTalkTitle ?? '')
    setPepTalkAt(plan.pepTalkAt ? plan.pepTalkAt.slice(0, 16) : '')
    setPepTalkTiming((plan.pepTalkTiming as PepTalkTiming) ?? '')
    setItems(plan.items ?? [])
    setHydrated(true)
  }, [plan, hydrated])

  const save = useMutation({
    mutationFn: () =>
      choirServiceOpsApi.upsertPreparation({
        choirId: choirId!,
        occurrenceId,
        uniformNotes: uniformNotes.trim() || undefined,
        pepTalkTitle: pepTalkTitle.trim() || undefined,
        pepTalkAt: pepTalkAt ? new Date(pepTalkAt).toISOString() : undefined,
        pepTalkTiming: pepTalkTiming || undefined,
        items,
      }),
    onSuccess: () => {
      toast.success('Preparation plan saved')
      qc.invalidateQueries({ queryKey: ['service-preparation'] })
    },
    onError: () => toast.error('Failed to save plan'),
  })

  function addItem() {
    setItems((prev) => [
      ...prev,
      { itemType: 'CUSTOM', title: '', body: '', sortOrder: prev.length },
    ])
  }

  function updateItem(index: number, patch: Partial<ServicePreparationItem>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  if (isLoading) return <SkeletonCard rows={8} />

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <Link href={choirLink('service-preparation')} className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold">
        <ArrowLeft size={14} /> All services
      </Link>

      <div>
        <h2 className="font-display text-2xl text-text-primary">
          {plan?.occurrence?.title ?? 'Service preparation'}
        </h2>
        {plan?.occurrence && (
          <p className="text-sm text-text-muted mt-1">
            {formatDate(plan.occurrence.startAt)} · {formatTime(plan.occurrence.startAt)}
          </p>
        )}
      </div>

      <PermissionGate
        anyOf={['choir.ops.manage', 'choir.operations.manage']}
        fallback={
          plan && (plan.uniformNotes || plan.pepTalkTitle || (plan.items?.length ?? 0) > 0) ? (
            <Card padding="md" className="space-y-4">
              {plan.uniformNotes && (
                <div>
                  <p className="text-sm font-semibold">Uniform</p>
                  <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">{plan.uniformNotes}</p>
                </div>
              )}
              {plan.pepTalkTitle && (
                <div>
                  <p className="text-sm font-semibold">Pep talk / short meeting</p>
                  <p className="text-sm text-text-secondary mt-1">{plan.pepTalkTitle}</p>
                  {plan.pepTalkAt && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatDate(plan.pepTalkAt)} · {formatTime(plan.pepTalkAt)}
                      {plan.pepTalkTiming ? ` · ${plan.pepTalkTiming.replace(/_/g, ' ').toLowerCase()}` : ''}
                    </p>
                  )}
                </div>
              )}
              {(plan.items?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Preparation items</p>
                  <ul className="space-y-2">
                    {plan.items.map((item, index) => (
                      <li key={item.id ?? index} className="text-sm border border-border rounded-lg p-3">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {item.itemType.replace(/_/g, ' ').toLowerCase()}
                          {item.song?.title ? ` · ${item.song.title}` : ''}
                        </p>
                        {item.body && (
                          <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">{item.body}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ) : (
            <Card padding="md">
              <p className="text-sm text-text-muted text-center py-6">
                Leaders have not published a preparation plan for this service yet.
              </p>
            </Card>
          )
        }
      >
        <Card padding="md">
          <p className="text-sm font-semibold mb-3">Uniform</p>
          <textarea
            value={uniformNotes}
            onChange={(e) => setUniformNotes(e.target.value)}
            placeholder="What to wear for this service"
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface resize-none"
          />

          <p className="text-sm font-semibold mt-4 mb-2">Pep talk / short meeting</p>
          <input
            value={pepTalkTitle}
            onChange={(e) => setPepTalkTitle(e.target.value)}
            placeholder="Meeting title"
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface mb-2"
          />
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              type="datetime-local"
              value={pepTalkAt}
              onChange={(e) => setPepTalkAt(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
            <select
              value={pepTalkTiming}
              onChange={(e) => setPepTalkTiming(e.target.value as PepTalkTiming | '')}
              className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            >
              <option value="">Before or after service</option>
              <option value="BEFORE_SERVICE">Before service</option>
              <option value="AFTER_SERVICE">After service</option>
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Preparation items</p>
            <button type="button" onClick={addItem} className="text-xs font-semibold text-primary-600">
              + Add item
            </button>
          </div>
          <div className="space-y-3 mt-2">
            {items.map((item, index) => (
              <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex gap-2">
                  <select
                    value={item.itemType}
                    onChange={(e) =>
                      updateItem(index, { itemType: e.target.value as ServicePreparationItemType })
                    }
                    className="flex-1 px-2 py-1.5 text-xs border border-border rounded-lg bg-surface"
                  >
                    {ITEM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeItem(index)} className="text-xs text-text-muted">
                    Remove
                  </button>
                </div>
                <input
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  placeholder="Title"
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-surface"
                />
                {item.itemType === 'SERVICE_SONG' && (
                  <select
                    value={item.songId ?? ''}
                    onChange={(e) => updateItem(index, { songId: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-surface"
                  >
                    <option value="">Select song</option>
                    {songs?.items?.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                )}
                <textarea
                  value={item.body ?? ''}
                  onChange={(e) => updateItem(index, { body: e.target.value })}
                  placeholder="Details / announcement text"
                  rows={2}
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-surface resize-none"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending || !choirId}
            className="mt-4 px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
          >
            {save.isPending ? 'Saving…' : 'Save preparation plan'}
          </button>
        </Card>
      </PermissionGate>

    </div>
  )
}
