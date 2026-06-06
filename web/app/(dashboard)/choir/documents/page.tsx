'use client'

import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api'
import { Card, Badge, SkeletonCard } from '@/components/shared'
import { FileText, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

export default function DocumentsPage() {
  const { data: docs, isLoading } = useQuery({
    queryKey: ['choir-documents'],
    queryFn:  documentsApi.getChoirDocuments,
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Documents</h2>
        <p className="text-text-secondary text-sm mt-1">Choir policies, forms, and files</p>
      </div>

      {isLoading ? (
        <SkeletonCard rows={5} />
      ) : (docs?.length ?? 0) === 0 ? (
        <Card padding="md">
          <div className="text-center py-12">
            <FileText size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No documents uploaded.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs?.map((doc) => (
            <Card key={doc.id} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <FileText size={20} className="text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{doc.title}</p>
                    {doc.description && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">{doc.description}</p>
                    )}
                    <p className="text-xs text-text-muted mt-1">
                      {formatDate(doc.createdAt)}
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
    </div>
  )
}
