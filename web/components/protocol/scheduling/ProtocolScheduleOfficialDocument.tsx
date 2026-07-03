'use client'

import { ProtocolScheduleBulletinGrid } from '@/components/protocol/scheduling/ProtocolScheduleBulletinGrid'

export function ProtocolScheduleOfficialDocument({
  data,
  className,
}: {
  data: Parameters<typeof ProtocolScheduleBulletinGrid>[0]['data']
  className?: string
  compact?: boolean
}) {
  return (
    <ProtocolScheduleBulletinGrid
      data={data}
      editable={false}
      className={className}
      exportId="protocol-schedule-bulletin"
    />
  )
}
