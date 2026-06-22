'use client'

import { useQuery } from '@tanstack/react-query'
import { rehearsalsApi } from '@/lib/api'
import { Card, Badge, SkeletonCard, EmptyState, CapabilityGate } from '@/components/shared'
import { Mic2 } from 'lucide-react'

export default function VoiceSectionsPage() {
  const { data: sections, isLoading } = useQuery({
    queryKey: ['voice-sections'],
    queryFn:  rehearsalsApi.getVoiceSections,
  })

  return (
    <CapabilityGate
      uiCapability="voice-sections-hub"
      fallback={
        <EmptyState
          title="Voice sections not available"
          description="You do not have permission to view choir voice sections."
        />
      }
    >
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Voice Sections</h2>
        <p className="text-text-secondary text-sm mt-1">
          Choir voice part groupings
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (sections?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <Mic2 size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No voice sections configured.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections?.map((s) => (
            <Card key={s.id} padding="md">
              <div className="flex items-center gap-3">
                <Mic2 size={20} className="text-primary-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">{s.name}</p>
                  {s.code && (
                    <div className="mt-1">
                      <Badge variant="ministry-choir">{s.code}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
    </CapabilityGate>
  )
}
