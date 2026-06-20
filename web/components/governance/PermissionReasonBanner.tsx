'use client'

import { Shield } from 'lucide-react'
import { useEffectivePermissions } from '@/lib/hooks/useEffectivePermissions'
import { reasonForPermission } from '@/lib/governance/permissions-preview'
import { cn } from '@/lib/utils'

type Props = {
  permissions: string[]
  className?: string
}

export function PermissionReasonBanner({ permissions, className }: Props) {
  const effective = useEffectivePermissions()
  const match = permissions.find((p) => effective.includes(p))

  if (!match) return null

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-3 py-2 rounded-lg border border-info/30 bg-info-light text-sm text-info',
        className,
      )}
    >
      <Shield size={15} className="shrink-0 mt-0.5" />
      <p>{reasonForPermission(match)}</p>
    </div>
  )
}
