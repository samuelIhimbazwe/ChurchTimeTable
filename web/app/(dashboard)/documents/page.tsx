'use client'

import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  Badge, SkeletonCard, EmptyState,
} from '@/components/shared'
import { formatDate } from '@/lib/utils/format'
import { FileText, Download, ExternalLink } from 'lucide-react'

const CATEGORY_VARIANT: Record<string, 'ministry-choir' | 'ministry-protocol' | 'default' | 'status-pending'> = {
  POLICY:     'ministry-protocol',
  HANDBOOK:   'ministry-choir',
  MUSIC:      'ministry-choir',
  FORM:       'status-pending',
  TEMPLATE:   'default',
}

function categoryLabel(category?: string) {
  if (!category) return 'General'
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function DocumentsPage() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', 'choir'],
    queryFn:  documentsApi.getChoirDocuments,
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Documents</h2>
        <p className="text-text-secondary text-sm mt-1">
          Choir resources and shared files
        </p>
      </div>

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Choir Library</CardTitle>
          <CardDescription>{documents?.length ?? 0} documents</CardDescription>
        </CardHeader>
        {isLoading ? (
          <SkeletonCard rows={6} />
        ) : (documents?.length ?? 0) === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents"
            description="Uploaded choir documents will appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {documents?.map((doc) => (
              <li
                key={doc.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-surface-raised transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text-primary">{doc.title}</p>
                    <Badge variant={CATEGORY_VARIANT[doc.category ?? ''] ?? 'default'}>
                      {categoryLabel(doc.category)}
                    </Badge>
                  </div>
                  {doc.description && (
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{doc.description}</p>
                  )}
                  <p className="text-xs text-text-muted mt-1">
                    {doc.fileName && `${doc.fileName} · `}
                    Updated {formatDate(doc.updatedAt ?? doc.createdAt)}
                  </p>
                </div>
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 shrink-0 transition-colors"
                  >
                    {doc.mimeType?.includes('pdf') ? <Download size={14} /> : <ExternalLink size={14} />}
                    Open
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
