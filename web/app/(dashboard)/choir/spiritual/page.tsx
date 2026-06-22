'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { devotionsApi, memberPortalApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, Badge, HubTabs, PermissionGate, SkeletonCard, EmptyState, CapabilityGate,
} from '@/components/shared'
import { useDevotionUiCapability } from '@/lib/hooks/useCapability'
import { formatDate } from '@/lib/utils/format'
import { SpiritualCommandHome } from '@/components/choir/committee/SpiritualCommandHome'
import { BookOpen, HeartHandshake, Sparkles } from 'lucide-react'

const TABS = [
  { id: 'intercession', label: 'Intercession (ibyifuzo)' },
  { id: 'programs', label: 'Prayer & fasting' },
  { id: 'devotions', label: 'Devotions' },
]

function dayIso(offset: number) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export default function SpiritualHubPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('intercession')

  const [todayTitle, setTodayTitle] = useState('Prayer focus — today')
  const [todayContent, setTodayContent] = useState('')
  const [tomorrowTitle, setTomorrowTitle] = useState('Prayer focus — tomorrow')
  const [tomorrowContent, setTomorrowContent] = useState('')

  const [devTitle, setDevTitle] = useState('')
  const [devContent, setDevContent] = useState('')
  const [devVerse, setDevVerse] = useState('')

  const { data: inbox, isLoading: loadingInbox } = useQuery({
    queryKey: ['intercessor-inbox'],
    queryFn: memberPortalApi.getIntercessorInbox,
  })

  const canManageDevotions = useDevotionUiCapability('devotion-manage')

  const { data: devotions, isLoading: loadingDev } = useQuery({
    queryKey: ['choir-devotions-manage'],
    queryFn: devotionsApi.listManage,
    enabled: canManageDevotions,
  })

  const updatePrayer = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'IN_PRAYER' | 'COMPLETED' }) =>
      memberPortalApi.updatePrayerRequestStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['intercessor-inbox'] })
      toast.success('Prayer request updated')
    },
    onError: () => toast.error('Could not update request'),
  })

  const publishTwoDay = useMutation({
    mutationFn: async () => {
      const today = await devotionsApi.create({
        title: todayTitle,
        content: todayContent,
        type: 'TWO_DAY_PRAYER',
        prayerDate: dayIso(0),
      })
      await devotionsApi.publish(today.id)
      const tomorrow = await devotionsApi.create({
        title: tomorrowTitle,
        content: tomorrowContent,
        type: 'TWO_DAY_PRAYER',
        prayerDate: dayIso(1),
      })
      await devotionsApi.publish(tomorrow.id)
    },
    onSuccess: () => {
      toast.success('Two-day prayer guide published to portal')
      qc.invalidateQueries({ queryKey: ['choir-devotions-manage'] })
      qc.invalidateQueries({ queryKey: ['member-portal'] })
    },
    onError: () => toast.error('Could not publish prayer guide'),
  })

  const createDevotion = useMutation({
    mutationFn: async () => {
      const row = await devotionsApi.create({
        title: devTitle,
        content: devContent,
        type: 'ENCOURAGEMENT',
        verseReference: devVerse || undefined,
      })
      return devotionsApi.publish(row.id)
    },
    onSuccess: () => {
      toast.success('Devotion published')
      setDevTitle('')
      setDevContent('')
      setDevVerse('')
      qc.invalidateQueries({ queryKey: ['choir-devotions-manage'] })
    },
    onError: () => toast.error('Could not publish devotion'),
  })

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Spiritual life</h1>
        <p className="text-text-secondary text-sm mt-1">
          Intercession, fasting & prayer programs, devotions, and holiness nurture for singers (ADEPR)
        </p>
      </div>

      <HubTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'intercession' && (
        <div className="space-y-6">
          <SpiritualCommandHome />
          <Card padding="md" accent="gold">
            <div className="flex items-start gap-3">
              <HeartHandshake size={20} className="text-gold-700 shrink-0" />
              <p className="text-sm text-text-secondary">
                Prayer requests (ibyifuzo) from members. Names are hidden unless they chose to be known.
                Pray in real life — this inbox is for coordination only.
              </p>
            </div>
          </Card>
          {loadingInbox ? (
            <SkeletonCard rows={4} />
          ) : (inbox?.length ?? 0) === 0 ? (
            <EmptyState
              icon={HeartHandshake}
              title="No pending prayer requests"
              description="When members submit ibyifuzo, they appear here for coordination."
            />
          ) : (
            <ul className="space-y-3">
              {inbox?.map((req) => (
                <Card key={req.id} padding="md">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-xs text-text-muted">From: {req.from}</p>
                      <p className="text-sm text-text-primary mt-2 leading-relaxed">{req.content}</p>
                      <p className="text-xs text-text-muted mt-2">{formatDate(req.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant="status-pending">{req.status}</Badge>
                      <PermissionGate anyOf={['choir.intercession.manage', 'choir.devotion.manage']}>
                        {req.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => updatePrayer.mutate({ id: req.id, status: 'IN_PRAYER' })}
                            className="text-xs font-semibold text-primary-600"
                          >
                            Mark in prayer
                          </button>
                        )}
                        {req.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => updatePrayer.mutate({ id: req.id, status: 'COMPLETED' })}
                            className="text-xs font-semibold text-success"
                          >
                            Completed
                          </button>
                        )}
                      </PermissionGate>
                    </div>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'programs' && (
        <PermissionGate anyOf={['choir.spiritual.program.manage', 'choir.devotion.manage']}>
          <Card padding="md">
            <div className="flex items-start gap-3 mb-4">
              <Sparkles size={20} className="text-gold-700" />
              <div>
                <p className="font-semibold text-text-primary">Two-day prayer guide</p>
                <p className="text-xs text-text-muted mt-1">
                  Published to member portal — today and tomorrow prayer focus.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-primary">Today</p>
                <input value={todayTitle} onChange={(e) => setTodayTitle(e.target.value)} className={inputClass} />
                <textarea
                  value={todayContent}
                  onChange={(e) => setTodayContent(e.target.value)}
                  rows={4}
                  placeholder="Prayer points for today…"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-primary">Tomorrow</p>
                <input value={tomorrowTitle} onChange={(e) => setTomorrowTitle(e.target.value)} className={inputClass} />
                <textarea
                  value={tomorrowContent}
                  onChange={(e) => setTomorrowContent(e.target.value)}
                  rows={4}
                  placeholder="Prayer points for tomorrow…"
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={publishTwoDay.isPending || !todayContent.trim() || !tomorrowContent.trim()}
              onClick={() => publishTwoDay.mutate()}
              className="mt-4 px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
            >
              Publish prayer guide
            </button>
          </Card>
        </PermissionGate>
      )}

      {tab === 'devotions' && (
        <CapabilityGate
          uiCapability="devotion-spiritual-content"
          fallback={
            <EmptyState
              title="Devotions not available"
              description="You do not have permission to view choir devotions."
            />
          }
        >
        <div className="space-y-4">
          <CapabilityGate uiCapability="devotion-publish-form">
            <Card padding="md">
              <p className="font-semibold mb-3">Publish encouragement / holiness message</p>
              <div className="space-y-3">
                <input
                  value={devTitle}
                  onChange={(e) => setDevTitle(e.target.value)}
                  placeholder="Title"
                  className={inputClass}
                />
                <input
                  value={devVerse}
                  onChange={(e) => setDevVerse(e.target.value)}
                  placeholder="Scripture reference (optional)"
                  className={inputClass}
                />
                <textarea
                  value={devContent}
                  onChange={(e) => setDevContent(e.target.value)}
                  rows={4}
                  placeholder="Message for singers…"
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={createDevotion.isPending || !devTitle.trim() || !devContent.trim()}
                  onClick={() => createDevotion.mutate()}
                  className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
                >
                  Publish devotion
                </button>
              </div>
            </Card>
          </CapabilityGate>

          {canManageDevotions && (loadingDev ? (
            <SkeletonCard rows={4} />
          ) : (
            <ul className="space-y-3">
              {devotions?.slice(0, 15).map((d) => (
                <Card key={d.id} padding="md">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{d.title}</p>
                      <p className="text-xs text-text-muted mt-1">{d.type.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-text-secondary mt-2 line-clamp-2">{d.content}</p>
                    </div>
                    <Badge variant={d.publishedAt ? 'status-present' : 'status-pending'}>
                      {d.publishedAt ? 'Live' : 'Draft'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </ul>
          ))}

          <Link href="/portal/devotion" className="text-sm font-semibold text-primary-600 inline-flex items-center gap-1">
            <BookOpen size={14} /> Member devotion center preview →
          </Link>
        </div>
        </CapabilityGate>
      )}
    </div>
  )
}
