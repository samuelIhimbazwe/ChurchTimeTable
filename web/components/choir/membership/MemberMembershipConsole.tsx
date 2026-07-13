'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HubTabs } from '@/components/shared'
import { MemberGivingConsole } from '@/components/choir/membership/MemberGivingConsole'
import { MembershipFamilyPanel } from '@/components/choir/membership/MembershipFamilyPanel'
import { MembershipAttendancePanel } from '@/components/choir/membership/MembershipAttendancePanel'
import {
  membershipProfilePath,
  type MembershipProfileTab,
} from '@/lib/choir/membership-office'

const TABS = [
  { id: 'family', label: 'My family' },
  { id: 'giving', label: 'My giving' },
  { id: 'attendance', label: 'My attendance' },
] as const

type Props = { choirId: string }

function resolveTab(raw: string | null): MembershipProfileTab {
  if (raw === 'giving' || raw === 'submit') return 'giving'
  if (raw === 'attendance') return 'attendance'
  return 'family'
}

export function MemberMembershipConsole({ choirId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawTab = searchParams.get('tab')
  const activeTab = resolveTab(rawTab)

  const setTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'family') {
        params.delete('tab')
      } else {
        params.set('tab', tab)
      }
      params.delete('detailId')
      params.delete('status')
      if (tab !== 'giving') params.delete('submit')
      const qs = params.toString()
      router.replace(
        qs ? `${membershipProfilePath(choirId)}?${qs}` : membershipProfilePath(choirId),
        { scroll: false },
      )
    },
    [router, searchParams, choirId],
  )

  return (
    <div className="space-y-5">
      <HubTabs tabs={[...TABS]} active={activeTab} onChange={setTab} />
      {activeTab === 'family' && <MembershipFamilyPanel choirId={choirId} />}
      {activeTab === 'giving' && <MemberGivingConsole choirId={choirId} />}
      {activeTab === 'attendance' && <MembershipAttendancePanel />}
    </div>
  )
}
