'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  disciplineApi,
  welfareApi,
  documentsApi,
  announcementsApi,
  ministriesApi,
  choirActivityApi,
} from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, Badge, Avatar, HubTabs, CapabilityGate, SkeletonCard, EmptyState,
} from '@/components/shared'
import { CareCommandHome } from '@/components/choir/committee/CareCommandHome'
import { formatDate } from '@/lib/utils/format'
import { Heart, Shield, FileText, Megaphone, Calendar, ExternalLink } from 'lucide-react'
import { useResolvedChoirScope } from '@/lib/hooks'
import { ChoirMemberPicker } from '@/components/choir/ChoirMemberPicker'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'rules', label: 'Choir rules' },
  { id: 'discipline', label: 'Discipline' },
  { id: 'welfare', label: 'Welfare' },
  { id: 'notices', label: 'Member notices' },
]

const WELFARE_VISIT_TYPES = ['Sick visit', 'Hospital visit', 'Bereavement', 'General care']

export default function CareHubPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('overview')
  const { choirId, choirLink } = useResolvedChoirScope()

  const [ruleTitle, setRuleTitle] = useState('')
  const [ruleBody, setRuleBody] = useState('')
  const [ruleUrl, setRuleUrl] = useState('')

  const [discMemberId, setDiscMemberId] = useState('')
  const [discDesc, setDiscDesc] = useState('')

  const [welfareMemberId, setWelfareMemberId] = useState('')
  const [welfareType, setWelfareType] = useState('Sick visit')
  const [welfareDesc, setWelfareDesc] = useState('')

  const [noticeTitle, setNoticeTitle] = useState('')
  const [noticeBody, setNoticeBody] = useState('')
  const [noticeKind, setNoticeKind] = useState('General')

  const { data: ministries } = useQuery({
    queryKey: ['ministries'],
    queryFn: ministriesApi.getAll,
  })
  const choirMinistry = ministries?.find((m) => m.code === 'CHOIR')

  const { data: documents, isLoading: loadingDocs } = useQuery({
    queryKey: ['choir-documents'],
    queryFn: documentsApi.getChoirDocuments,
  })
  const ruleDocs = documents?.filter((d) =>
    ['POLICY', 'CONSTITUTION', 'policy', 'constitution'].includes(String(d.category ?? '')),
  )

  const { data: discipline, isLoading: loadingDisc } = useQuery({
    queryKey: ['discipline'],
    queryFn: () => disciplineApi.getAll(),
  })

  const { data: welfare, isLoading: loadingWelfare } = useQuery({
    queryKey: ['welfare'],
    queryFn: () => welfareApi.getAll(),
  })

  const { data: activities } = useQuery({
    queryKey: ['choir-activities', choirId, { limit: 5 }],
    queryFn: () => choirActivityApi.getAll({ choirId, limit: 5 }),
    enabled: !!choirId,
  })

  const createRule = useMutation({
    mutationFn: () =>
      documentsApi.createChoirDocument({
        title: ruleTitle,
        category: 'POLICY',
        description: ruleBody,
        fileName: `${ruleTitle.replace(/\s+/g, '-').toLowerCase()}.md`,
        fileUrl: ruleUrl || `data:text/plain,${encodeURIComponent(ruleBody)}`,
        mimeType: 'text/plain',
      }),
    onSuccess: () => {
      toast.success('Choir rule saved')
      setRuleTitle('')
      setRuleBody('')
      setRuleUrl('')
      qc.invalidateQueries({ queryKey: ['choir-documents'] })
    },
    onError: () => toast.error('Could not save rule'),
  })

  const shareRules = useMutation({
    mutationFn: () => {
      if (!choirMinistry?.id) throw new Error('No choir ministry')
      const body = ruleDocs?.length
        ? `Updated choir rules are available. Please review: ${ruleDocs.map((d) => d.title).join(', ')}`
        : ruleBody || 'Please review our choir rules and standards.'
      return announcementsApi.createMinistry(choirMinistry.id, {
        title: '[Rules] Choir rules & standards',
        body,
      })
    },
    onSuccess: () => toast.success('Rules shared with all choir members'),
    onError: () => toast.error('Could not publish rules announcement'),
  })

  const createDiscipline = useMutation({
    mutationFn: () =>
      disciplineApi.create({ memberId: discMemberId, description: discDesc, ministry: 'CHOIR' }),
    onSuccess: () => {
      toast.success('Discipline case opened — member will be notified')
      setDiscMemberId('')
      setDiscDesc('')
      qc.invalidateQueries({ queryKey: ['discipline'] })
    },
    onError: () => toast.error('Failed to open case'),
  })

  const createWelfare = useMutation({
    mutationFn: () =>
      welfareApi.create({
        memberId: welfareMemberId,
        type: welfareType,
        description: welfareDesc,
      }),
    onSuccess: () => {
      toast.success('Welfare case opened')
      setWelfareMemberId('')
      setWelfareDesc('')
      qc.invalidateQueries({ queryKey: ['welfare'] })
    },
    onError: () => toast.error('Failed to open welfare case'),
  })

  const sendNotice = useMutation({
    mutationFn: () => {
      if (!choirMinistry?.id) throw new Error('No choir ministry')
      return announcementsApi.createMinistry(choirMinistry.id, {
        title: `[${noticeKind}] ${noticeTitle}`,
        body: noticeBody,
      })
    },
    onSuccess: () => {
      toast.success('Notice sent to choir members')
      setNoticeTitle('')
      setNoticeBody('')
      qc.invalidateQueries({ queryKey: ['choir-announcements'] })
    },
    onError: () => toast.error('Could not send notice'),
  })

  const activeDiscipline = discipline?.filter((c) => !c.resolvedAt) ?? []
  const openWelfare = welfare?.filter((c) => c.status !== 'RESOLVED') ?? []

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500'

  return (
    <CapabilityGate
      uiCapability="care-hub"
      fallback={
        <EmptyState
          title="Care hub not available"
          description="You do not have permission to access care and discipline tools."
        />
      }
    >
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Care & discipline</h1>
        <p className="text-text-secondary text-sm mt-1">
          Attendance compliance, choir rules, discipline, welfare visits, and member notices
        </p>
      </div>

      <HubTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="space-y-6">
          <CapabilityGate uiCapability="care-command-home">
            <CareCommandHome />
          </CapabilityGate>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card padding="md" onClick={() => setTab('discipline')}>
            <Shield size={20} className="text-warning mb-2" />
            <p className="text-2xl font-display font-bold">{activeDiscipline.length}</p>
            <p className="text-sm text-text-muted">Active discipline cases</p>
            <p className="text-xs font-semibold text-primary-600 mt-2">Manage →</p>
          </Card>
          <Card padding="md" onClick={() => setTab('welfare')}>
            <Heart size={20} className="text-danger mb-2" />
            <p className="text-2xl font-display font-bold">{openWelfare.length}</p>
            <p className="text-sm text-text-muted">Open welfare cases</p>
            <p className="text-xs font-semibold text-primary-600 mt-2">Manage →</p>
          </Card>
          <Card padding="md" onClick={() => setTab('rules')}>
            <FileText size={20} className="text-primary-600 mb-2" />
            <p className="text-2xl font-display font-bold">{ruleDocs?.length ?? 0}</p>
            <p className="text-sm text-text-muted">Published rule documents</p>
            <p className="text-xs font-semibold text-primary-600 mt-2">View rules →</p>
          </Card>
          <Card padding="md" className="sm:col-span-2 lg:col-span-3" href={choirLink('activities')}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-text-primary flex items-center gap-2">
                <Calendar size={16} /> Upcoming activities (attendance)
              </p>
              <span className="text-xs font-semibold text-primary-600">Full schedule →</span>
            </div>
            <ul className="space-y-2">
              {(activities?.items ?? []).slice(0, 4).map((a) => (
                <li key={a.id} className="text-sm text-text-secondary flex justify-between gap-2">
                  <span>{a.title}</span>
                  <span className="text-text-muted shrink-0">{formatDate(a.date)}</span>
                </li>
              ))}
              {(activities?.items?.length ?? 0) === 0 && (
                <li className="text-sm text-text-muted">No upcoming activities.</li>
              )}
            </ul>
          </Card>
          </div>
        </div>
      )}

      {tab === 'rules' && (
        <div className="space-y-4">
          <CapabilityGate uiCapability="care-rules-manage">
            <Card padding="md" accent="info">
              <p className="font-semibold text-text-primary mb-3">Add or update choir rules</p>
              <div className="space-y-3">
                <input
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  placeholder="Rule document title"
                  className={inputClass}
                />
                <textarea
                  value={ruleBody}
                  onChange={(e) => setRuleBody(e.target.value)}
                  rows={5}
                  placeholder="Choir rules, standards, and expectations…"
                  className={inputClass}
                />
                <input
                  value={ruleUrl}
                  onChange={(e) => setRuleUrl(e.target.value)}
                  placeholder="Optional link to PDF (leave blank to use text above)"
                  className={inputClass}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={createRule.isPending || !ruleTitle.trim()}
                    onClick={() => createRule.mutate()}
                    className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
                  >
                    Save rule
                  </button>
                  <button
                    type="button"
                    disabled={shareRules.isPending}
                    onClick={() => shareRules.mutate()}
                    className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-surface-raised"
                  >
                    Share with all members
                  </button>
                </div>
              </div>
            </Card>
          </CapabilityGate>

          {loadingDocs ? (
            <SkeletonCard rows={3} />
          ) : (ruleDocs?.length ?? 0) === 0 ? (
            <EmptyState
              icon={FileText}
              title="No rule documents yet"
              description="Add choir rules above or upload via Documents."
              actionHref={choirLink('documents')}
              actionLabel="Open documents"
            />
          ) : (
            <ul className="space-y-3">
              {ruleDocs?.map((doc) => (
                <Card key={doc.id} padding="md">
                  <p className="font-semibold text-text-primary">{doc.title}</p>
                  {doc.description && (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-3">{doc.description}</p>
                  )}
                  {doc.fileUrl && !doc.fileUrl.startsWith('data:') && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 mt-2"
                    >
                      Open document <ExternalLink size={12} />
                    </a>
                  )}
                </Card>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'discipline' && (
        <div className="space-y-4">
          <CapabilityGate uiCapability="discipline-manage">
            <Card padding="md">
              <p className="font-semibold mb-3">Open discipline case</p>
              <div className="space-y-3">
                <ChoirMemberPicker value={discMemberId} onChange={(id) => setDiscMemberId(id)} />
                <textarea
                  value={discDesc}
                  onChange={(e) => setDiscDesc(e.target.value)}
                  rows={3}
                  placeholder="Issue, warning context, or measure taken…"
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={createDiscipline.isPending || !discMemberId || !discDesc.trim()}
                  onClick={() => createDiscipline.mutate()}
                  className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
                >
                  Open case (notifies member)
                </button>
              </div>
            </Card>
          </CapabilityGate>
          {loadingDisc ? (
            <SkeletonCard rows={4} />
          ) : (
            <ul className="space-y-3">
              {discipline?.map((c) => (
                <Card key={c.id} padding="md">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{c.memberId}</p>
                      <p className="text-sm text-text-secondary mt-1">{c.description}</p>
                      <p className="text-xs text-text-muted mt-1">{formatDate(c.openedAt)}</p>
                    </div>
                    <Badge variant={c.resolvedAt ? 'status-present' : 'status-pending'}>
                      {c.resolvedAt ? 'Resolved' : c.stage}
                    </Badge>
                  </div>
                </Card>
              ))}
            </ul>
          )}
          <Link href={choirLink('discipline')} className="text-sm font-semibold text-primary-600">
            Full discipline module →
          </Link>
        </div>
      )}

      {tab === 'welfare' && (
        <div className="space-y-4">
          <CapabilityGate uiCapability="welfare-manage">
            <Card padding="md" accent="gold">
              <p className="font-semibold mb-3">New welfare case (e.g. visit sick member)</p>
              <div className="space-y-3">
                <ChoirMemberPicker value={welfareMemberId} onChange={(id) => setWelfareMemberId(id)} />
                <select
                  value={welfareType}
                  onChange={(e) => setWelfareType(e.target.value)}
                  className={inputClass}
                >
                  {WELFARE_VISIT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <textarea
                  value={welfareDesc}
                  onChange={(e) => setWelfareDesc(e.target.value)}
                  rows={3}
                  placeholder="Situation, visit plan, follow-up notes…"
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={createWelfare.isPending || !welfareMemberId || !welfareDesc.trim()}
                  onClick={() => createWelfare.mutate()}
                  className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
                >
                  Open welfare case
                </button>
              </div>
            </Card>
          </CapabilityGate>
          {loadingWelfare ? (
            <SkeletonCard rows={4} />
          ) : (
            <ul className="space-y-3">
              {welfare?.map((c) => (
                <Card key={c.id} padding="md">
                  <div className="flex items-start gap-3">
                    <Avatar name={c.memberName ?? c.memberId} size="sm" />
                    <div>
                      <p className="text-sm font-semibold">{c.memberName ?? c.memberId}</p>
                      <Badge variant="default" className="mt-1">{c.type}</Badge>
                      <p className="text-sm text-text-secondary mt-2">{c.description}</p>
                      <p className="text-xs text-text-muted mt-1">{formatDate(c.createdAt)}</p>
                    </div>
                    <Badge variant={c.status === 'RESOLVED' ? 'status-present' : 'status-pending'}>
                      {c.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </ul>
          )}
          <Link href={choirLink('welfare')} className="text-sm font-semibold text-primary-600">
            Full welfare module →
          </Link>
        </div>
      )}

      {tab === 'notices' && (
        <CapabilityGate uiCapability="care-notices-send">
          <Card padding="md">
            <div className="flex items-start gap-3 mb-4">
              <Megaphone size={20} className="text-primary-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text-primary">Message choir members</p>
                <p className="text-xs text-text-muted mt-1">
                  Use for warnings, discipline outcomes, welfare follow-ups, or general care notices.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <select
                value={noticeKind}
                onChange={(e) => setNoticeKind(e.target.value)}
                className={inputClass}
              >
                <option>General</option>
                <option>Warning</option>
                <option>Discipline</option>
                <option>Welfare</option>
                <option>Attendance</option>
              </select>
              <input
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="Subject"
                className={inputClass}
              />
              <textarea
                value={noticeBody}
                onChange={(e) => setNoticeBody(e.target.value)}
                rows={5}
                placeholder="Message to members…"
                className={inputClass}
              />
              <button
                type="button"
                disabled={sendNotice.isPending || !noticeTitle.trim() || !noticeBody.trim()}
                onClick={() => sendNotice.mutate()}
                className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg disabled:opacity-60"
              >
                Send to choir members
              </button>
            </div>
          </Card>
        </CapabilityGate>
      )}
    </div>
    </CapabilityGate>
  )
}
