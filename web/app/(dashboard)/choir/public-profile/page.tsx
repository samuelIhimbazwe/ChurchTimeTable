'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useResolvedChoirScope } from '@/lib/hooks'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'
import { toast } from '@/components/shared/Toast'
import {
  Card, CardHeader, CardTitle, CardDescription,
  SkeletonCard, EmptyState,
} from '@/components/shared'
import { ExternalLink, Eye, Music, Settings2 } from 'lucide-react'

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'apple', label: 'Apple Music' },
  { value: 'other', label: 'Other' },
]

const inputClass =
  'w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500'

export default function ChoirPublicProfilePage() {
  const qc = useQueryClient()
  const [summary, setSummary] = useState('')
  const [showMemberCount, setShowMemberCount] = useState(false)
  const [highlightRelease, setHighlightRelease] = useState(false)
  const [releaseTitle, setReleaseTitle] = useState('')
  const [releaseUrl, setReleaseUrl] = useState('')
  const [releasePlatform, setReleasePlatform] = useState('youtube')
  const [releaseDescription, setReleaseDescription] = useState('')

  const { choirId, choirName } = useResolvedChoirScope()

  const { data: profile, isLoading: loadingProfile, error } = useQuery({
    queryKey: ['member-portal', 'choir', choirId, 'edit'],
    queryFn: () => memberPortalApi.getChoirPublic(choirId),
    enabled: !!choirId,
  })

  useEffect(() => {
    if (!profile) return
    const override = profile.featuredReleaseOverride
    setSummary(profile.profileSummary ?? profile.publicSummary ?? profile.description ?? '')
    setShowMemberCount(profile.showMemberCount)
    setHighlightRelease(!!override)
    setReleaseTitle(override?.title ?? '')
    setReleaseUrl(override?.url ?? '')
    setReleasePlatform(override?.platform ?? 'youtube')
    setReleaseDescription(override?.description ?? '')
  }, [
    profile?.id,
    profile?.profileSummary,
    profile?.publicSummary,
    profile?.description,
    profile?.showMemberCount,
    profile?.featuredReleaseOverride,
  ])

  const save = useMutation({
    mutationFn: () => {
      if (!choirId) throw new Error('No choir selected')
      const trimmedSummary = summary.trim()
      const payload: Parameters<typeof memberPortalApi.updateChoirPublic>[1] = {
        showMemberCountPublic: showMemberCount,
        publicProfile: {
          summary: trimmedSummary || undefined,
          featuredRelease: highlightRelease
            ? {
                title: releaseTitle.trim(),
                url: releaseUrl.trim(),
                platform: releasePlatform,
                description: releaseDescription.trim() || undefined,
              }
            : null,
        },
      }
      return memberPortalApi.updateChoirPublic(choirId, payload)
    },
    onSuccess: () => {
      toast.success('Public choir profile updated')
      qc.invalidateQueries({ queryKey: ['member-portal'] })
    },
    onError: () => toast.error('Could not save — check that you have permission to edit this choir'),
  })

  const canSaveRelease = !highlightRelease || (
    releaseTitle.trim().length > 0 && releaseUrl.trim().length > 0
  )

  if (loadingProfile && !!choirId) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <SkeletonCard rows={2} />
        <SkeletonCard rows={8} />
      </div>
    )
  }

  if (!choirId) {
    return (
      <EmptyState
        icon={Music}
        title="No choir assigned"
        description="Open this page from your choir dashboard to manage its public profile."
      />
    )
  }

  if (error && !profile) {
    return (
      <EmptyState
        icon={Settings2}
        title="Cannot load profile"
        description="You may not have access to edit this choir's public page."
      />
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Public profile</h2>
          <p className="text-text-secondary text-sm mt-1">
            What members see when they browse <strong>{choirName ?? 'your choir'}</strong> in the portal
          </p>
        </div>
        {profile && (
          <Link
            href={`/portal/choirs/${profile.id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-surface-raised shrink-0"
          >
            <Eye size={14} /> Preview
          </Link>
        )}
      </div>

      <Card padding="md">
        <CardHeader className="p-0 mb-4">
          <CardTitle>About this choir</CardTitle>
          <CardDescription>
            Short description shown on the choir list and detail page
          </CardDescription>
        </CardHeader>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={5}
          placeholder="Tell members about your choir's mission, style, and who can join…"
          className={inputClass}
        />
      </Card>

      <Card padding="md">
        <CardHeader className="p-0 mb-4">
          <CardTitle>Member count</CardTitle>
          <CardDescription>
            Hidden by default for privacy — enable only if you want the count visible on the portal
          </CardDescription>
        </CardHeader>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showMemberCount}
            onChange={(e) => setShowMemberCount(e.target.checked)}
            className="mt-1 rounded border-border"
          />
          <span className="text-sm text-text-secondary">
            Show member count on the public choir page
            {profile?.memberCount != null && showMemberCount && (
              <span className="block text-xs text-text-muted mt-1">
                Currently {profile.memberCount} active members
              </span>
            )}
          </span>
        </label>
      </Card>

      <Card padding="md">
        <CardHeader className="p-0 mb-4">
          <CardTitle>Featured release</CardTitle>
          <CardDescription>
            Highlight a recent album or song with a link to listen or watch
          </CardDescription>
        </CardHeader>
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={highlightRelease}
            onChange={(e) => setHighlightRelease(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-sm text-text-secondary">Highlight a specific release</span>
        </label>
        {!highlightRelease && profile?.featuredRelease && (
          <p className="text-xs text-text-muted mb-4">
            Without a custom release, members may see your latest uploaded song automatically.
          </p>
        )}
        {highlightRelease && (
          <div className="space-y-3">
            <input
              type="text"
              value={releaseTitle}
              onChange={(e) => setReleaseTitle(e.target.value)}
              placeholder="Song or album title"
              className={inputClass}
            />
            <input
              type="url"
              value={releaseUrl}
              onChange={(e) => setReleaseUrl(e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
            <select
              value={releasePlatform}
              onChange={(e) => setReleasePlatform(e.target.value)}
              className={inputClass}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <textarea
              value={releaseDescription}
              onChange={(e) => setReleaseDescription(e.target.value)}
              rows={2}
              placeholder="Optional short note about this release"
              className={inputClass}
            />
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-4 pt-2">
        <Link
          href="/choir"
          className="text-sm font-semibold text-text-muted hover:text-text-primary"
        >
          Back to dashboard
        </Link>
        <button
          type="button"
          disabled={save.isPending || !canSaveRelease}
          onClick={() => save.mutate()}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
        >
          {save.isPending ? 'Saving…' : 'Save public profile'}
          <ExternalLink size={14} className="opacity-80" />
        </button>
      </div>
    </div>
  )
}
