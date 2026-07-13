'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useResolvedChoirScope } from '@/lib/hooks'
import { INTERNAL_CHOIR_MEMBERSHIP, memberOnboardingHref } from '@/lib/choir/membership-intake'

export default function PresidentDecisionsPage() {
  const router = useRouter()
  const { choirLink } = useResolvedChoirScope()

  useEffect(() => {
    if (INTERNAL_CHOIR_MEMBERSHIP) {
      router.replace(memberOnboardingHref(choirLink))
    }
  }, [router, choirLink])

  if (INTERNAL_CHOIR_MEMBERSHIP) {
    return (
      <p className="text-sm text-text-muted text-center py-12">
        Member onboarding replaces join-request decisions for internal choirs.
      </p>
    )
  }

  return null
}
