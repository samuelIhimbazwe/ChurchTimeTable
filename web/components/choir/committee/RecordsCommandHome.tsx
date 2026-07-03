'use client'

import { useQuery } from '@tanstack/react-query'
import { documentsApi, choirApi, auditApi } from '@/lib/api'
import { OfficeCommandHome } from '@/components/shared/office/OfficeCommandHome'
import { Card, SkeletonCard } from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'

export function RecordsCommandHome() {
  const { choirId, choirLink } = useResolvedChoirScope()

  const { data: documents, isLoading: loadingDocs } = useQuery({
    queryKey: ['choir-documents'],
    queryFn: documentsApi.getChoirDocuments,
  })

  const { data: meetings } = useQuery({
    queryKey: ['choir-meetings'],
    queryFn: choirApi.getMeetings,
  })

  const { data: audit } = useQuery({
    queryKey: ['choir-audit-recent'],
    queryFn: () => auditApi.getAuditLog({ limit: 5, page: 1 }),
  })

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">Open from your choir dashboard.</p>
      </Card>
    )
  }

  if (loadingDocs) {
    return <SkeletonCard rows={4} />
  }

  const docCount = documents?.length ?? 0
  const meetingCount = meetings?.length ?? 0
  const auditItems = (audit as { items?: unknown[] } | undefined)?.items ?? []

  return (
    <OfficeCommandHome
      title="Records command"
      subtitle="Official documents, meetings, and audit trail for choir identity."
      widgets={[
        {
          id: 'documents',
          label: 'Documents',
          primary: docCount,
          secondary: 'Policies, minutes, and official files',
          cta: 'Document library →',
          href: choirLink('documents'),
        },
        {
          id: 'meetings',
          label: 'Meetings',
          primary: meetingCount,
          secondary: 'Committee meetings and action items',
          cta: 'Meetings hub →',
          href: choirLink('meetings'),
        },
        {
          id: 'audit',
          label: 'Recent audit',
          primary: auditItems.length > 0 ? auditItems.length : '—',
          secondary: 'Latest governance and system events',
          cta: 'Full audit log →',
          href: choirLink('records'),
        },
      ]}
    />
  )
}
