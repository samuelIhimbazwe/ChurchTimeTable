'use client'

import { ProtocolDocumentsShelf } from '@/components/protocol/ProtocolDocumentsShelf'

export default function ProtocolDocumentsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Protocol documents</h2>
        <p className="text-text-secondary text-sm mt-1">
          Official policies, rosters, and forms for the protocol committee
        </p>
      </div>
      <ProtocolDocumentsShelf showTitle={false} />
    </div>
  )
}
