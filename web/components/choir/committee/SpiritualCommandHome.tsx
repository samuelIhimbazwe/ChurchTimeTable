'use client'

import { useQuery } from '@tanstack/react-query'
import { memberPortalApi, devotionsApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

export function SpiritualCommandHome() {
  const { choirLink } = useResolvedChoirScope()

  const { data: inbox, isLoading: loadingInbox } = useQuery({
    queryKey: ['intercessor-inbox'],
    queryFn: memberPortalApi.getIntercessorInbox,
  })

  const { data: devotions, isLoading: loadingDev } = useQuery({
    queryKey: ['choir-devotions-manage'],
    queryFn: devotionsApi.listManage,
  })

  if (loadingInbox || loadingDev) {
    return <SkeletonCard rows={4} />
  }

  const openPrayers =
    inbox?.filter((row) => row.status !== 'COMPLETED').length ?? 0
  const publishedDevotions =
    devotions?.filter((row) => row.publishedAt).length ?? 0

  return (
    <OfficeCommandHome
      title="Spiritual command"
      subtitle="Intercession queue, prayer guides, and published devotions."
      widgets={[
        {
          id: 'prayer',
          label: 'Prayer inbox',
          primary: openPrayers > 0 ? openPrayers : '✓',
          secondary:
            openPrayers > 0
              ? 'Member prayer requests awaiting care'
              : 'No open intercession items',
          cta: openPrayers > 0 ? 'Open intercession →' : 'Prayer programs →',
          href: choirLink('spiritual'),
          tone: openPrayers > 0 ? 'warning' : 'success',
        },
        {
          id: 'devotions',
          label: 'Published devotions',
          primary: publishedDevotions,
          secondary: 'Encouragements and verse-of-day content',
          cta: 'Manage devotions →',
          href: choirLink('spiritual'),
        },
        {
          id: 'programs',
          label: 'Prayer & fasting',
          secondary: 'Two-day prayer guide and holiness programs',
          primary: 'Plan',
          cta: 'Spiritual programs →',
          href: choirLink('spiritual'),
        },
      ]}
    />
  )
}
