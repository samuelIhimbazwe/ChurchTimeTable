'use client'

import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api'
import { useChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { RoleHeroBand } from '@/components/portal/home/RoleHeroBand'
import { PortalVerseGlance } from '@/components/portal/home/PortalVerseGlance'
import { useTranslations } from '@/lib/i18n'
import { SkeletonCard } from '@/components/shared'

export function ChoirMembershipWelcome() {
  const { tr } = useTranslations()
  const { context } = useChoirDashboardCtx()
  const choirName = context?.choir.name ?? tr('Choir')

  const { data: home, isLoading } = useQuery({
    queryKey: ['member-portal-home'],
    queryFn: memberPortalApi.getHome,
  })

  const verse = home?.spiritual?.verseOfDay ?? null
  const weekCount =
    home?.participation?.thisWeek?.filter((e) => e.ministry === 'CHOIR').length ?? 0

  if (isLoading) {
    return <SkeletonCard rows={2} />
  }

  return (
    <RoleHeroBand
      accent="choir"
      churchName={home?.welcome?.churchName ?? choirName}
      title={`${tr('Welcome to')} ${choirName}`}
      subtitle={
        weekCount > 0
          ? tr('You have choir events this week — check your schedule and giving.')
          : tr('Your membership home — attendance, giving, and team in one place.')
      }
      className="mb-5"
    >
      <PortalVerseGlance verse={verse} />
    </RoleHeroBand>
  )
}
