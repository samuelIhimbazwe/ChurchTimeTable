'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api'
import { useChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { OfficeNavCard } from '@/components/choir/OfficeNavCard'
import { resolveMemberLeadershipOffices } from '@/lib/choir/member-leadership-offices'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import { Briefcase } from 'lucide-react'

type Props = {
  choirId: string
}

export function MemberLeadershipOfficePage({ choirId }: Props) {
  const router = useRouter()
  const { context } = useChoirDashboardCtx()

  const { data: familyCtx } = useQuery({
    queryKey: ['family-leadership-context'],
    queryFn: () => financeApi.getFamilyContributionContext(),
  })

  const offices = useMemo(
    () =>
      resolveMemberLeadershipOffices(
        choirId,
        context,
        familyCtx?.families?.map((f) => ({
          role: f.role,
          familyName: f.familyName,
        })),
      ),
    [choirId, context, familyCtx?.families],
  )

  const choirOffices = offices.filter((o) => o.group === 'choir')
  const familyOffices = offices.filter((o) => o.group === 'family')

  useEffect(() => {
    if (offices.length === 0) {
      router.replace(membershipOfficePath(choirId))
    }
  }, [offices.length, choirId, router])

  if (offices.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-text-primary flex items-center gap-2">
          <Briefcase size={22} className="text-primary-600" />
          My offices
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Leadership desks for choir and family roles you hold. Regular membership
          tabs stay on the other sections.
        </p>
      </div>

      {choirOffices.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Choir leadership
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {choirOffices.map((office) => (
              <OfficeNavCard key={office.id} href={office.href}>
                <p className="font-semibold text-text-primary">{office.label}</p>
                {office.subtitle && (
                  <p className="text-sm text-text-secondary mt-1">{office.subtitle}</p>
                )}
              </OfficeNavCard>
            ))}
          </div>
        </section>
      )}

      {familyOffices.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Family leadership
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {familyOffices.map((office) => (
              <OfficeNavCard key={office.id} href={office.href}>
                <p className="font-semibold text-text-primary">{office.label}</p>
                {office.subtitle && (
                  <p className="text-sm text-text-secondary mt-1">{office.subtitle}</p>
                )}
              </OfficeNavCard>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
