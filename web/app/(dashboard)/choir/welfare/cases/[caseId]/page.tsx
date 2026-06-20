'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { welfareApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, Badge, Avatar, PermissionGate, SkeletonCard,
} from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'
import { formatDate } from '@/lib/utils/format'
import { EntityTimeline } from '@/components/workflow/EntityTimeline'
import { CaseAgingBadge } from '@/components/workflow/CaseAgingBadge'
import { FormField, Input, Textarea } from '@/components/shared/form'
import { SensitiveReveal } from '@/components/governance/SensitiveReveal'
import { PermissionReasonBanner } from '@/components/governance/PermissionReasonBanner'

const STATUS_BADGE: Record<WelfareCase['status'], 'status-absent' | 'status-pending' | 'status-present'> = {
  OPEN:        'status-absent',
  IN_PROGRESS: 'status-pending',
  RESOLVED:    'status-present',
}

import { ArrowLeft, Heart } from 'lucide-react'
import type { WelfareCase } from '@/types'

export default function WelfareCaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const { choirLink } = useResolvedChoirScope()
  const qc = useQueryClient()

  const [assistType, setAssistType] = useState('')
  const [assistDesc, setAssistDesc] = useState('')
  const [assistAmount, setAssistAmount] = useState('')

  const { data: welfareCase, isLoading } = useQuery({
    queryKey: ['welfare-case', caseId],
    queryFn: () => welfareApi.getById(caseId),
    enabled: !!caseId,
  })

  const { data: timeline } = useQuery({
    queryKey: ['welfare-case-timeline', caseId],
    queryFn: () => welfareApi.getTimeline(caseId),
    enabled: !!caseId,
  })

  const recordAssistance = useMutation({
    mutationFn: () =>
      welfareApi.recordAssistance(caseId, {
        type: assistType,
        description: assistDesc,
        amount: assistAmount ? Number(assistAmount) : undefined,
      }),
    onSuccess: () => {
      toast.success('Assistance recorded')
      setAssistType('')
      setAssistDesc('')
      setAssistAmount('')
      qc.invalidateQueries({ queryKey: ['welfare-case', caseId] })
      qc.invalidateQueries({ queryKey: ['welfare-case-timeline', caseId] })
      qc.invalidateQueries({ queryKey: ['welfare'] })
    },
    onError: () => toast.error('Failed to record assistance'),
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <SkeletonCard rows={6} />
      </div>
    )
  }

  if (!welfareCase) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link
          href={choirLink('welfare')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline mb-4"
        >
          <ArrowLeft size={14} />
          Back to welfare cases
        </Link>
        <Card padding="md">
          <p className="text-sm text-text-muted text-center py-12">Case not found.</p>
        </Card>
      </div>
    )
  }

  const events = (timeline ?? []).map((e, i) => {
    const row = e as { summary?: string; at?: string; timestamp?: string; type?: string }
    return {
      id: String(i),
      summary: row.summary ?? row.type ?? 'Event',
      at: row.at,
      timestamp: row.timestamp,
    }
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <Link
        href={choirLink('welfare')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
      >
        <ArrowLeft size={14} />
        Back to welfare cases
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar name={welfareCase.memberName} size="md" />
          <div>
            <h2 className="font-display text-2xl text-text-primary">{welfareCase.memberName}</h2>
            <p className="text-sm text-text-muted capitalize mt-0.5">{welfareCase.type}</p>
            <p className="text-xs text-text-muted mt-1">
              Opened {formatDate(welfareCase.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge variant={STATUS_BADGE[welfareCase.status]}>{welfareCase.status}</Badge>
          <CaseAgingBadge openedAt={welfareCase.createdAt} />
        </div>
      </div>

      <PermissionReasonBanner
        permissions={['choir.welfare.manage', 'choir.welfare.view']}
      />

      <Card padding="md">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
          Situation
        </p>
        <SensitiveReveal label="Welfare case notes — click to reveal">
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{welfareCase.description}</p>
        </SensitiveReveal>
      </Card>

      <EntityTimeline title="Case timeline" events={events} />

      {welfareCase.status !== 'RESOLVED' && (
        <PermissionGate permission="choir.welfare.manage">
          <Card padding="md" accent="info">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={16} className="text-primary-600" />
              <p className="font-semibold text-sm">Record assistance</p>
            </div>
            <div className="space-y-3">
              <FormField label="Assistance type" htmlFor="assist-type">
                <Input
                  id="assist-type"
                  placeholder="e.g. Food, transport"
                  value={assistType}
                  onChange={(e) => setAssistType(e.target.value)}
                />
              </FormField>
              <FormField label="Description" htmlFor="assist-desc">
                <Textarea
                  id="assist-desc"
                  placeholder="What was provided"
                  value={assistDesc}
                  onChange={(e) => setAssistDesc(e.target.value)}
                  rows={3}
                />
              </FormField>
              <FormField label="Amount (optional)" htmlFor="assist-amt" hint="Leave blank if not applicable">
                <Input
                  id="assist-amt"
                  type="number"
                  value={assistAmount}
                  onChange={(e) => setAssistAmount(e.target.value)}
                />
              </FormField>
              <button
                type="button"
                onClick={() => recordAssistance.mutate()}
                disabled={!assistType.trim() || !assistDesc.trim() || recordAssistance.isPending}
                className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
              >
                {recordAssistance.isPending ? 'Saving…' : 'Save assistance'}
              </button>
            </div>
          </Card>
        </PermissionGate>
      )}

      <p className="text-xs text-text-muted">
        For SLA triage and care workflows, use the{' '}
        <Link href={choirLink('care/desk')} className="text-primary-600 font-semibold hover:underline">
          care desk
        </Link>
        .
      </p>
    </div>
  )
}
