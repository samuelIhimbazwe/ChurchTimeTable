'use client'

import { Suspense } from 'react'
import { SkeletonCard } from '@/components/shared'
import { ProtocolReplacementRequestForm } from '@/components/protocol/ProtocolReplacementRequestForm'
import { ProtocolReplacementsConsole } from '@/components/protocol/ProtocolReplacementsConsole'

function ReplacementsContent() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ProtocolReplacementRequestForm />
      <ProtocolReplacementsConsole />
    </div>
  )
}

export default function ReplacementsPage() {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <ReplacementsContent />
    </Suspense>
  )
}
