'use client'

import { useQuery } from '@tanstack/react-query'
import { familiesApi, welfareApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { Card, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

export function FamilyCoordinatorCommandHome() {
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: families, isLoading } = useQuery({
    queryKey: ['families-with-metrics'],
    queryFn: () => familiesApi.getAll({ includeMetrics: true, limit: 100 }),
  })

  const { data: welfare } = useQuery({
    queryKey: ['welfare'],
    queryFn: () => welfareApi.getAll(),
  })

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Open from your choir dashboard.</p>
      </Card>
    )
  }

  if (isLoading) {
    return <SkeletonCard rows={4} />
  }

  const familyCount = families?.length ?? 0
  const memberTotal = families?.reduce((sum, f) => sum + (f.memberCount ?? 0), 0) ?? 0
  const openWelfare = welfare?.filter((c) => c.status !== 'RESOLVED').length ?? 0
  const behindFamilies =
    families?.filter((f) => {
      const pct = Number((f as { givingProgressPct?: number }).givingProgressPct ?? 0)
      return pct > 0 && pct < 50
    }).length ?? 0

  return (
    <OfficeCommandHome
      title="Family coordination"
      subtitle="Cross-family rankings, welfare signals, and choir-wide participation."
      widgets={[
        {
          id: 'families',
          label: 'Families',
          primary: familyCount,
          secondary: `${memberTotal} members across teams`,
          cta: 'Family structure →',
          href: choirLink('families'),
        },
        {
          id: 'welfare',
          label: 'Welfare signals',
          primary: openWelfare > 0 ? openWelfare : '✓',
          secondary:
            openWelfare > 0
              ? 'Open cases need care officer follow-up'
              : 'No open welfare cases',
          cta: openWelfare > 0 ? 'Care hub →' : 'Welfare history →',
          href: choirLink('care'),
          tone: openWelfare > 0 ? 'warning' : 'success',
        },
        {
          id: 'rankings',
          label: 'Giving health',
          primary: behindFamilies > 0 ? behindFamilies : '✓',
          secondary:
            behindFamilies > 0
              ? 'Families below 50% campaign progress'
              : 'Families on track',
          cta: 'Rankings desk →',
          href: choirLink('family-coordinator'),
        },
      ]}
    />
  )
}
