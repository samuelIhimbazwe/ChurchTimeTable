'use client'

import { useState, useRef } from 'react'
import { systemApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/shared'
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const IMPORT_TYPES = [
  { value: 'members',       label: 'Members CSV' },
  { value: 'contributions', label: 'Contributions CSV' },
  { value: 'families',      label: 'Families CSV' },
]

export default function ImportPage() {
  const [file,    setFile]    = useState<File | null>(null)
  const [type,    setType]    = useState('members')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<{ imported: number; errors: string[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const res = await systemApi.runImport(file, type)
      setResult(res)
      toast.success(`Imported ${res.imported} records`)
    } catch {
      toast.error('Import failed', 'Check the file format and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Pilot Import</h2>
        <p className="text-text-secondary text-sm mt-1">
          Bulk import data from CSV files
        </p>
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Select a CSV file and import type</CardDescription>
        </CardHeader>

        <div className="space-y-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
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
              if (f) setFile(f)
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
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
                  Drop CSV file here or click to browse
                </p>
                <p className="text-xs text-text-muted mt-1">Only .csv files</p>
              </>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'Importing…' : 'Run Import'}
          </button>
        </div>
      </Card>

      {result && (
        <Card accent={result.errors.length > 0 ? 'warning' : 'success'} padding="md">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-success" />
            <span className="font-semibold text-text-primary">
              {result.imported} records imported
            </span>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-warning">
                {result.errors.length} errors:
              </p>
              {result.errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <AlertCircle size={12} className="shrink-0 mt-0.5 text-warning" />
                  {e}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
