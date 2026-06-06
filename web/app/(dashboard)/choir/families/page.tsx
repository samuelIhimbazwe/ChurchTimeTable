'use client'

import { useQuery } from '@tanstack/react-query'
import { familiesApi } from '@/lib/api'
import { Card, SkeletonCard } from '@/components/shared'
import { Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

export default function FamiliesPage() {
  const { data: families, isLoading } = useQuery({
    queryKey: ['families'],
    queryFn:  familiesApi.getAll,
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Families</h2>
        <p className="text-text-secondary text-sm mt-1">
          {families?.length ?? '—'} registered families
        </p>
      </div>

      <Card padding="none">
        {isLoading ? (
          <SkeletonCard rows={6} />
        ) : (families?.length ?? 0) === 0 ? (
          <div className="text-center py-12">
            <Users size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No families registered.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {families?.map((f, i) => (
              <li key={f.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-raised transition-colors">
                <span className="font-display font-bold text-2xl text-text-muted w-8 text-right shrink-0">
                  {f.rank ?? i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{f.name}</p>
                  <p className="text-xs text-text-muted">
                    Head: {f.headName} · {f.memberCount} members
                  </p>
                </div>
                <span className="font-semibold text-sm text-text-primary shrink-0">
                  {formatCurrency(f.totalContributions)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
