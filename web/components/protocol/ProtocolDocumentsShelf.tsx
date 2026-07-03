'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { protocolApi } from '@/lib/api'
import { Card, Badge, SkeletonCard, CapabilityGate } from '@/components/shared'
import { ProtocolDocumentsUploadModal } from '@/components/protocol/ProtocolDocumentsUploadModal'
import { FileText, ExternalLink, Upload, Eye, X } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

const CATEGORY_TABS = ['ALL', 'POLICY', 'FORM', 'GUIDE', 'OTHER'] as const

export function ProtocolDocumentsShelf({
  compact = false,
  showTitle = true,
  allowUpload = false,
}: {
  compact?: boolean
  showTitle?: boolean
  allowUpload?: boolean
}) {
  const [category, setCategory] = useState<string>('ALL')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['protocol-documents'],
    queryFn: protocolApi.getDocuments,
  })

  const ministryName = data?.ministry?.name ?? "Deacons' Ministry"
  const docs = data?.items ?? []
  const disabled = data?.documentsDisabled

  const filtered = useMemo(() => {
    if (category === 'ALL') return docs
    return docs.filter((d) => (d.category ?? 'OTHER') === category)
  }, [docs, category])

  const previewDoc = filtered.find((d) => d.id === previewId) ?? docs.find((d) => d.id === previewId)

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Ministry documents</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Policies and forms on the {ministryName} shelf (MF-1)
            </p>
          </div>
          {allowUpload && (
            <CapabilityGate platformUiCapability="protocol-manage">
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-700 text-white"
              >
                <Upload size={14} /> Upload
              </button>
            </CapabilityGate>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setCategory(tab)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
              category === tab
                ? 'bg-primary-700 text-white border-primary-700'
                : 'border-border text-text-muted'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card padding="md">
              <div className={compact ? 'py-6 text-center' : 'text-center py-10'}>
                <FileText size={compact ? 24 : 32} className="text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">No documents in this category.</p>
              </div>
            </Card>
          ) : (
            filtered.map((doc) => (
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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewId(doc.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-primary-600"
                      >
                        <Eye size={13} /> Preview
                      </button>
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
                </div>
              </Card>
            ))
          )}
        </div>

        {previewDoc && (
          <Card padding="md" className="h-fit sticky top-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="font-semibold text-sm">{previewDoc.title}</p>
              <button type="button" onClick={() => setPreviewId(null)} className="text-text-muted">
                <X size={16} />
              </button>
            </div>
            {previewDoc.description && (
              <p className="text-sm text-text-secondary mb-3">{previewDoc.description}</p>
            )}
            {previewDoc.mimeType?.startsWith('image/') && previewDoc.fileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.title}
                className="w-full rounded-lg border border-border"
              />
            ) : previewDoc.fileUrl ? (
              <iframe
                title={previewDoc.title}
                src={previewDoc.fileUrl}
                className="w-full h-80 rounded-lg border border-border bg-surface-raised"
              />
            ) : (
              <p className="text-sm text-text-muted">No preview available.</p>
            )}
          </Card>
        )}
      </div>

      {!compact && docs.length > 0 && (
        <p className="text-xs text-text-muted">
          Full shelf:{' '}
          <Link href="/protocol/documents" className="font-semibold text-primary-600 hover:text-primary-800">
            Protocol documents →
          </Link>
        </p>
      )}

      <ProtocolDocumentsUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
