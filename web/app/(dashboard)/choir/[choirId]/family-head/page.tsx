'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import { familyOfficePath, resolveFamilyOfficeKindFromRole } from '@/lib/choir/family-office'
import { choirMemberHome } from '@/lib/choir/paths'

export default function LegacyFamilyHeadRedirect() {
  const params = useParams()
  const router = useRouter()
  const choirId = String(params.choirId)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  useEffect(() => {
    if (isLoading) return
    const role = data?.families?.[0]?.role
    const kind = resolveFamilyOfficeKindFromRole(role)
    if (kind) {
      router.replace(familyOfficePath(choirId, kind))
      return
    }
    router.replace(choirMemberHome(choirId))
  }, [isLoading, isError, data, router, choirId])

  return (
    <div className="py-16 text-center text-sm text-text-muted">Opening your family office…</div>
  )
}
