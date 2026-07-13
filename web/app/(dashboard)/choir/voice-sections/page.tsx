'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useResolvedChoirScope } from '@/lib/hooks'

/** MVP: standalone voice-sections desk removed — voice parts stay in roster/music flows. */
export default function VoiceSectionsPage() {
  const router = useRouter()
  const { choirLink } = useResolvedChoirScope()

  useEffect(() => {
    router.replace(choirLink(''))
  }, [router, choirLink])

  return (
    <p className="text-sm text-text-muted text-center py-12">
      Voice sections are managed from the music library and roster — redirecting…
    </p>
  )
}
