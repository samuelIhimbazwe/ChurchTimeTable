'use client'

import { useQuery } from '@tanstack/react-query'
import { churchScheduleApi } from '@/lib/api'
import {
  Card, Badge, SkeletonCard, EmptyState, CapabilityGate,
} from '@/components/shared'
import { Building2, Bell } from 'lucide-react'

export default function ChurchFacilitiesPage() {
  const { data: facilities, isLoading } = useQuery({
    queryKey: ['church-facilities'],
    queryFn: () => churchScheduleApi.listFacilities(),
  })

  const items = Array.isArray(facilities) ? facilities : []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Church facilities</h2>
        <p className="text-text-secondary text-sm mt-1">
          Rooms and spaces used for master schedule conflict detection
        </p>
      </div>

      <CapabilityGate platformUiCapability="church-facility-manage">
        <Card padding="sm" accent="info">
          <p className="text-sm text-text-secondary">
            Facility create/edit UI arrives in a later phase. Rooms are seeded for pilot use.
          </p>
        </Card>
      </CapabilityGate>

      <Card padding="none">
        {isLoading ? (
          <div className="p-5"><SkeletonCard rows={6} /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No facilities"
            description="Run database seed to load default church rooms."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-surface-raised transition-colors"
              >
                <Building2 size={18} className="text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{f.name}</p>
                  <p className="text-xs text-text-muted">
                    {f.code}
                    {f.building && ` · ${f.building}`}
                    {f.capacity != null && ` · capacity ${f.capacity}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {f.requiresAdminNotify && (
                    <Badge variant="status-excused" className="inline-flex items-center gap-1">
                      <Bell size={10} /> Notify admin
                    </Badge>
                  )}
                  {!f.isActive && <Badge variant="status-absent">Inactive</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
