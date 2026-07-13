'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentsApi, type DocumentItem } from '@/lib/api'
import {
  Card,
  Badge,
  SkeletonCard,
  AccessRedirectGate,
  HubTabs,
  CapabilityGate,
  EmptyState,
} from '@/components/shared'
import { ChoirDocumentsUploadModal } from '@/components/choir/ChoirDocumentsUploadModal'
import { FileText, ExternalLink, Upload } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import { useUiCapability } from '@/lib/hooks/useCapability'

const TABS = [
  { id: 'policies', label: 'Choir policies' },
  { id: 'forms', label: 'Forms' },
  { id: 'files', label: 'Files' },
] as const

type TabId = (typeof TABS)[number]['id']

const POLICY_CATEGORIES = new Set(['POLICY', 'CONSTITUTION'])
const FORM_CATEGORIES = new Set(['FORM', 'TRAINING', 'REHEARSAL_GUIDE', 'WELFARE'])

function normalizeChoirDoc(raw: unknown): DocumentItem | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const version =
    row.currentVersion && typeof row.currentVersion === 'object'
      ? (row.currentVersion as Record<string, unknown>)
      : null
  const id = typeof row.id === 'string' ? row.id : null
  const title = typeof row.title === 'string' ? row.title : null
  if (!id || !title) return null
  const createdAt =
    typeof row.createdAt === 'string'
      ? row.createdAt
      : typeof row.updatedAt === 'string'
        ? row.updatedAt
        : new Date().toISOString()
  return {
    id,
    title,
    category: typeof row.category === 'string' ? row.category : undefined,
    description: typeof row.description === 'string' ? row.description : undefined,
    fileName:
      (typeof version?.fileName === 'string' ? version.fileName : undefined)
      ?? (typeof row.fileName === 'string' ? row.fileName : undefined),
    fileUrl:
      (typeof version?.fileUrl === 'string' ? version.fileUrl : undefined)
      ?? (typeof row.fileUrl === 'string' ? row.fileUrl : undefined),
    mimeType:
      (typeof version?.mimeType === 'string' ? version.mimeType : undefined)
      ?? (typeof row.mimeType === 'string' ? row.mimeType : undefined),
    createdAt,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : undefined,
  }
}

function tabForCategory(category?: string): TabId {
  const cat = (category ?? 'OTHER').toUpperCase()
  if (POLICY_CATEGORIES.has(cat)) return 'policies'
  if (FORM_CATEGORIES.has(cat)) return 'forms'
  return 'files'
}

const EMPTY_COPY: Record<TabId, string> = {
  policies: 'No choir policies uploaded yet.',
  forms: 'No forms uploaded yet.',
  files: 'No files uploaded yet.',
}

export default function DocumentsPage() {
  const [tab, setTab] = useState<TabId>('policies')
  const [uploadOpen, setUploadOpen] = useState(false)
  const canManage = useUiCapability('logistics-documents-manage')

  const { data: docs, isLoading } = useQuery({
    queryKey: ['choir-documents'],
    queryFn: async () => {
      const raw = await documentsApi.getChoirDocuments()
      return (raw as unknown[])
        .map(normalizeChoirDoc)
        .filter((d): d is DocumentItem => Boolean(d))
    },
  })

  const filtered = useMemo(
    () => (docs ?? []).filter((doc) => tabForCategory(doc.category) === tab),
    [docs, tab],
  )

  return (
    <AccessRedirectGate uiCapability="logistics-documents-hub">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-text-primary">Documents</h2>
            <p className="text-text-secondary text-sm mt-1">
              Policies, forms, and shared choir files
            </p>
          </div>
          <CapabilityGate uiCapability="logistics-documents-manage">
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-700 text-white"
            >
              <Upload size={16} /> Upload
            </button>
          </CapabilityGate>
        </div>

        <HubTabs
          tabs={[...TABS]}
          active={tab}
          onChange={(id) => setTab(id as TabId)}
        />

        {isLoading ? (
          <SkeletonCard rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={EMPTY_COPY[tab]}
            description={
              canManage
                ? 'Upload a file from your device or paste a link to store it here.'
                : 'Documents added by officers will appear here.'
            }
            action={
              canManage
                ? { label: 'Upload document', onClick: () => setUploadOpen(true) }
                : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((doc) => (
              <Card key={doc.id} padding="md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText size={20} className="text-primary-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{doc.title}</p>
                      {doc.description && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                      <p className="text-xs text-text-muted mt-1">
                        {formatDate(doc.updatedAt ?? doc.createdAt)}
                        {doc.fileName ? ` · ${doc.fileName}` : ''}
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

        <CapabilityGate uiCapability="logistics-documents-manage">
          <ChoirDocumentsUploadModal
            open={uploadOpen}
            onClose={() => setUploadOpen(false)}
            defaultTab={tab}
          />
        </CapabilityGate>
      </div>
    </AccessRedirectGate>
  )
}
