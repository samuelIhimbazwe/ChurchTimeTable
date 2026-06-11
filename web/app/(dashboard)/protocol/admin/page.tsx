'use client'

import { PermissionGate } from '@/components/shared'
import { ProtocolAdminHub } from '@/components/protocol/ProtocolAdminHub'
import Link from 'next/link'

export default function ProtocolAdminPage() {
  return (
    <PermissionGate
      anyOf={[
        'committee.member.manage',
        'protocol.invite',
        'protocol.claim.review',
        'protocol.manage',
      ]}
      fallback={
        <div className="max-w-lg mx-auto py-16 text-center space-y-3">
          <p className="text-text-muted text-sm">
            Ministry admin access is assigned by the protocol president/leader.
          </p>
          <Link href="/protocol/member" className="text-sm font-semibold text-primary-600">
            Back to protocol home →
          </Link>
        </div>
      }
    >
      <ProtocolAdminHub />
    </PermissionGate>
  )
}
