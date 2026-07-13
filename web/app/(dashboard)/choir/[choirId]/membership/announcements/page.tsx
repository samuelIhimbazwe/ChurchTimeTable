'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { membershipAnnouncementsHref, membershipOfficePath } from '@/lib/choir/membership-office'
import { useUiCapability } from '@/lib/hooks/useCapability'
import { formatDate } from '@/lib/utils/format'
import { ChevronRight, Megaphone } from 'lucide-react'

export default function MembershipAnnouncementsPage() {
  const params = useParams()
  const router = useRouter()
  const choirId = String(params.choirId)
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')
  const canManageAnnouncements = useUiCapability('comms-announcements-manage', choirId)

  useEffect(() => {
    if (canManageAnnouncements) {
      router.replace(membershipAnnouncementsHref(choirId, { canManage: true }))
    }
  }, [canManageAnnouncements, choirId, router])

  const { data: home, isLoading } = useQuery({
    queryKey: ['member-portal-home'],
    queryFn: memberPortalApi.getHome,
    enabled: !canManageAnnouncements,
  })

  if (canManageAnnouncements) {
    return (
      <p className="text-sm text-text-muted text-center py-12">
        Opening announcements desk…
      </p>
    )
  }

  const announcements = home?.announcements?.filter((a) => a.source === 'choir') ?? []
  const selected = selectedId
    ? announcements.find((a) => a.id === selectedId)
    : undefined

  return (
    <div className="space-y-5">
      {selected && (
        <Card padding="md" id={`announcement-${selected.id}`}>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Megaphone size={16} className="text-primary-600" />
            <p className="font-semibold text-text-primary">{selected.title}</p>
            {selected.pinned && <Badge variant="status-excused">Pinned</Badge>}
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{selected.body}</p>
          {selected.publishedAt && (
            <p className="text-xs text-text-muted mt-3">{formatDate(selected.publishedAt)}</p>
          )}
        </Card>
      )}

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : announcements.length === 0 ? (
        <Card padding="md">
          <p className="text-sm text-text-muted text-center py-8">No choir announcements right now.</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => {
            const isSelected = a.id === selectedId
            return (
              <li key={a.id}>
                <Link
                  href={`${membershipOfficePath(choirId, 'announcements')}?id=${a.id}`}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <Card
                    padding="md"
                    className={`transition-all duration-fast hover:shadow-raised hover:-translate-y-0.5 ${
                      isSelected ? 'ring-2 ring-primary-300' : ''
                    }`}
                    id={`announcement-${a.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Megaphone size={16} className="text-primary-600" />
                          <p className="font-semibold text-text-primary">{a.title}</p>
                          {a.pinned && <Badge variant="status-excused">Pinned</Badge>}
                        </div>
                        <p className={`text-sm text-text-secondary whitespace-pre-wrap ${isSelected ? '' : 'line-clamp-4'}`}>
                          {a.body}
                        </p>
                        {a.publishedAt && (
                          <p className="text-xs text-text-muted mt-3">{formatDate(a.publishedAt)}</p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-text-muted shrink-0 mt-1" />
                    </div>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
