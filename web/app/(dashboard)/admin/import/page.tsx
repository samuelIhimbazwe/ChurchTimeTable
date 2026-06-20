'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { systemApi } from '@/lib/api'
import type { ImportJobRecord } from '@/lib/api/modules/system'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle, CardDescription, Badge, EmptyState, PermissionGate } from '@/components/shared'
import { ImportColumnMapping } from '@/components/admin/ImportColumnMapping'
import { readCsvHeaders, detectColumnsFromPreviewRows } from '@/lib/import/import-column-specs'
import { Upload, FileText, CheckCircle2, History } from 'lucide-react'
import { cn } from '@/lib/utils'

const IMPORT_TYPES = [
  { value: 'MEMBERS', label: 'Members CSV' },
  { value: 'CHOIR_MEMBERS', label: 'Choir members CSV' },
  { value: 'PROTOCOL_MEMBERS', label: 'Protocol members CSV' },
  { value: 'MINISTRIES', label: 'Ministries CSV' },
  { value: 'MINISTRY_MEMBERS', label: 'Ministry members CSV' },
  { value: 'LEADERSHIP_ASSIGNMENTS', label: 'Leadership assignments CSV' },
  { value: 'ASSETS', label: 'Assets CSV' },
  { value: 'SCHEDULES', label: 'Schedules CSV' },
] as const

const CONFLICT_STRATEGIES = [
  { value: 'SKIP', label: 'Skip conflicts' },
  { value: 'REPLACE', label: 'Replace existing' },
  { value: 'MERGE', label: 'Merge rows' },
  { value: 'MANUAL_REVIEW', label: 'Manual review (skip conflicts)' },
] as const

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<string>('MEMBERS')
  const [strategy, setStrategy] = useState<'SKIP' | 'REPLACE' | 'MERGE' | 'MANUAL_REVIEW'>('SKIP')
  const [loading, setLoading] = useState(false)
  const [previewJob, setPreviewJob] = useState<ImportJobRecord | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [fileColumns, setFileColumns] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      setFileColumns([])
      return
    }
    readCsvHeaders(file)
      .then(setFileColumns)
      .catch(() => setFileColumns([]))
  }, [file])

  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ['import-history'],
    queryFn: systemApi.listImports,
    enabled: showHistory,
  })

  async function handlePreview() {
    if (!file) return
    setLoading(true)
    setPreviewJob(null)
    try {
      const job = await systemApi.uploadImportPreview(file, type)
      setPreviewJob(job)
      toast.success('Preview ready — review counts before confirming')
    } catch {
      toast.error('Preview failed', 'Check file format and import type.')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!previewJob) return
    setLoading(true)
    try {
      const job = await systemApi.confirmImport(previewJob.id, strategy)
      setPreviewJob(job)
      await refetchHistory()
      const applied = job.results?.appliedCount ?? 0
      toast.success(`Imported ${applied} records`)
    } catch {
      toast.error('Import failed', 'Resolve conflicts or try a different strategy.')
    } finally {
      setLoading(false)
    }
  }

  const summary = previewJob?.preview?.summary
  const isPreviewing = previewJob?.status === 'PREVIEWING'
  const isDone = previewJob?.status === 'COMPLETED'

  const detectedColumns =
    fileColumns.length > 0
      ? fileColumns
      : detectColumnsFromPreviewRows([
          ...(previewJob?.preview?.invalidRows ?? []),
          ...(previewJob?.preview?.duplicateRows ?? []),
          ...(previewJob?.preview?.conflictRows ?? []),
        ])

  return (
    <PermissionGate
      anyOf={['pilot.import.manage', 'admin.users.manage']}
      fallback={
        <EmptyState
          icon={Upload}
          title="Import access required"
          description="You need import or user-management permissions to use the import center."
          className="py-16"
        />
      }
    >
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Import Center</h2>
          <p className="text-text-secondary text-sm mt-1">
            Upload CSV or XLSX — preview, resolve conflicts, then confirm
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800"
        >
          <History size={14} />
          {showHistory ? 'Hide history' : 'History'}
        </button>
      </div>

      {type === 'PROTOCOL_MEMBERS' && (
        <Card padding="md" accent="info">
          <p className="text-sm text-text-secondary">
            Protocol member import adds active members to the <strong>PROTOCOL_TEAM</strong> operational unit.
            Rows need <code className="text-xs">email</code> or <code className="text-xs">memberNumber</code>.
          </p>
        </Card>
      )}

      <Card padding="md">
        <CardHeader>
          <CardTitle>1. Choose type & upload</CardTitle>
          <CardDescription>UTF-8 CSV recommended; Excel uses the first worksheet</CardDescription>
        </CardHeader>

        <div className="space-y-4">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setPreviewJob(null)
            }}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            {IMPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) {
                setFile(f)
                setPreviewJob(null)
              }
            }}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer',
              'transition-colors duration-fast',
              file
                ? 'border-success bg-success-light'
                : 'border-border hover:border-primary-400 hover:bg-surface-raised',
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setPreviewJob(null)
              }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-success">
                <FileText size={20} />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload size={24} className="text-text-muted mx-auto mb-2" />
                <p className="text-sm font-medium text-text-primary">
                  Drop file here or click to browse
                </p>
                <p className="text-xs text-text-muted mt-1">CSV or Excel</p>
              </>
            )}
          </div>

          <button
            onClick={handlePreview}
            disabled={!file || loading}
            className="w-full py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-60"
          >
            {loading && !previewJob ? 'Building preview…' : '2. Preview import'}
          </button>
        </div>
      </Card>

      <ImportColumnMapping importType={type} fileColumns={detectedColumns} />

      {summary && (
        <Card padding="md" accent={summary.invalid > 0 ? 'warning' : 'success'}>
          <CardHeader>
            <CardTitle>Preview summary</CardTitle>
            <CardDescription>
              Job {previewJob?.id?.slice(0, 8)} · {previewJob?.fileName}
            </CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
            <div>
              <p className="text-2xl font-bold text-text-primary">{summary.valid}</p>
              <p className="text-xs text-text-muted">Valid</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{summary.invalid}</p>
              <p className="text-xs text-text-muted">Invalid</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-secondary">{summary.duplicates}</p>
              <p className="text-xs text-text-muted">Duplicates</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{summary.conflicts}</p>
              <p className="text-xs text-text-muted">Conflicts</p>
            </div>
          </div>

          {previewJob?.preview?.duplicateRows?.length ? (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-semibold text-text-secondary">Duplicate rows (sample)</p>
              {previewJob.preview.duplicateRows.slice(0, 5).map((row) => (
                <p key={row.row} className="text-xs text-text-secondary">
                  Row {row.row}: {row.reason}
                </p>
              ))}
            </div>
          ) : null}

          {previewJob?.preview?.conflictRows?.length ? (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-semibold text-text-secondary">Conflicts (sample)</p>
              {previewJob.preview.conflictRows.slice(0, 5).map((row) => (
                <p key={row.row} className="text-xs text-text-secondary">
                  Row {row.row}: {row.reason}
                </p>
              ))}
            </div>
          ) : null}

          {previewJob?.preview?.invalidRows?.length ? (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-semibold text-warning">Invalid rows (sample)</p>
              {previewJob.preview.invalidRows.slice(0, 5).map((row) => (
                <p key={row.row} className="text-xs text-text-secondary">
                  Row {row.row}: {row.errors.join(', ')}
                </p>
              ))}
            </div>
          ) : null}

          {isPreviewing && (
            <div className="mt-4 space-y-3">
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as typeof strategy)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border"
              >
                {CONFLICT_STRATEGIES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                onClick={handleConfirm}
                disabled={loading || summary.valid === 0}
                className="w-full py-2.5 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 disabled:opacity-60"
              >
                {loading ? 'Importing…' : '3. Confirm import'}
              </button>
            </div>
          )}

          {isDone && (
            <div className="mt-4 flex items-center gap-2 text-success">
              <CheckCircle2 size={18} />
              <span className="text-sm font-semibold">
                {previewJob?.results?.appliedCount ?? 0} applied ·
                {previewJob?.results?.failedCount ?? 0} failed ·
                {previewJob?.results?.skippedCount ?? 0} skipped
              </span>
            </div>
          )}
        </Card>
      )}

      {showHistory && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Import history</CardTitle>
          </CardHeader>
          {(history?.length ?? 0) === 0 ? (
            <EmptyState
              icon={History}
              title="No imports yet"
              description="Uploaded files will appear here after you run a preview."
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-border">
              {history?.map((job) => (
                <li key={job.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{job.type}</p>
                    <p className="text-xs text-text-muted">
                      {job.fileName ?? 'file'} · {job.uploadedBy?.email ?? 'admin'}
                    </p>
                  </div>
                  <Badge variant="default">{job.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
    </PermissionGate>
  )
}
