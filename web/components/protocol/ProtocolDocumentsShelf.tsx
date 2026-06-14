'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { protocolApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { FileText, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export function ProtocolDocumentsShelf({
  compact = false,
  showTitle = true,
}: {
  compact?: boolean
  showTitle?: boolean
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['protocol-documents'],
    queryFn: protocolApi.getDocuments,
  })

  const ministryName = data?.ministry?.name ?? "Deacons' Ministry"
  const docs = data?.items ?? []
  const disabled = data?.documentsDisabled

  if (isLoading) {
    return <SkeletonCard rows={compact ? 2 : 4} />
  }

  if (disabled) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted">
          Ministry document shelf is disabled in settings for {ministryName}.
        </p>
      </Card>
    )
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {showTitle && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Ministry documents</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Policies and forms on the {ministryName} shelf (MF-1)
          </p>
        </div>
      )}

      {docs.length === 0 ? (
        <Card padding="md">
          <div className={compact ? 'py-6 text-center' : 'text-center py-10'}>
            <FileText size={compact ? 24 : 32} className="text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No documents uploaded yet.</p>
            {!compact && (
              <p className="text-xs text-text-muted mt-1">
                Church admins can upload via ministry document management.
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <Card key={doc.id} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText size={18} className="text-primary-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{doc.title}</p>
                    {doc.description && !compact && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">{doc.description}</p>
                    )}
                    <p className="text-xs text-text-muted mt-1">
                      {formatDate(doc.updatedAt ?? doc.createdAt)}
                      {doc.fileName && ` · ${doc.fileName}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {doc.category && <Badge variant="default">{doc.category}</Badge>}
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800"
                    >
                      <ExternalLink size={13} /> Open
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!compact && docs.length > 0 && (
        <p className="text-xs text-text-muted">
          Full shelf:{' '}
          <Link href="/protocol/documents" className="font-semibold text-primary-600 hover:text-primary-800">
            Protocol documents →
          </Link>
        </p>
      )}
    </div>
  )
}
