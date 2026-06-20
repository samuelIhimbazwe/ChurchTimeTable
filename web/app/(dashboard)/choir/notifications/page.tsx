'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useResolvedChoirId } from '@/lib/hooks'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import { SkeletonCard } from '@/components/shared'

export default function LegacyChoirNotificationsPage() {
  const router = useRouter()
  const choirId = useResolvedChoirId()

  useEffect(() => {
    if (choirId) {
      router.replace(membershipOfficePath(choirId, 'notifications'))
    } else {
      router.replace('/notifications')
    }
  }, [choirId, router])

  return <SkeletonCard rows={4} />
}
