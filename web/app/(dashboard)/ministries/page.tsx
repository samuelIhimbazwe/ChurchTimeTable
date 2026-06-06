'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ministriesApi } from '@/lib/api'
import { Card, Badge, SkeletonCard, EmptyState } from '@/components/shared'
import { Building2, Users, ChevronRight } from 'lucide-react'

export default function MinistriesPage() {
  const { data: ministries, isLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn:  ministriesApi.getAll,
  })

  const items = ministries ?? []

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Ministries</h2>
        <p className="text-text-secondary text-sm mt-1">
          {items.length} active ministr{items.length === 1 ? 'y' : 'ies'}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="md"><SkeletonCard rows={2} /></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Building2} title="No ministries" description="Ministries will appear here once configured." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => (
            <Link key={m.id} href={`/ministries/${m.id}`}>
              <Card padding="md" className="hover:shadow-raised transition-shadow h-full group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Building2 size={20} className="text-primary-700" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary group-hover:text-primary-700 transition-colors">
                        {m.name}
                      </p>
                      {m.code && (
                        <p className="text-xs text-text-muted">{m.code}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-text-muted group-hover:text-primary-600 transition-colors" />
                </div>
                {m.description && (
                  <p className="text-xs text-text-muted mt-3 line-clamp-2">{m.description}</p>
                )}
                <div className="flex items-center gap-3 mt-4">
                  <span className="flex items-center gap-1 text-xs text-text-secondary">
                    <Users size={13} /> {m.memberCount ?? 0} members
                  </span>
                  <Badge variant={m.isActive !== false ? 'status-active' : 'status-inactive'}>
                    {m.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
