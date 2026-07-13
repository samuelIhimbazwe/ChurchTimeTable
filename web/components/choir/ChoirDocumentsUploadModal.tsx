'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Upload, X } from 'lucide-react'

const CATEGORY_BY_TAB = {
  policies: 'POLICY',
  forms: 'TRAINING',
  files: 'OTHER',
} as const

type TabId = keyof typeof CATEGORY_BY_TAB

const CATEGORY_OPTIONS = [
  { value: 'POLICY', label: 'Policy' },
  { value: 'CONSTITUTION', label: 'Constitution' },
  { value: 'TRAINING', label: 'Form / training' },
  { value: 'REHEARSAL_GUIDE', label: 'Rehearsal guide' },
  { value: 'WELFARE', label: 'Welfare form' },
  { value: 'MEETING_MINUTES', label: 'Meeting minutes' },
  { value: 'EVENT', label: 'Event file' },
  { value: 'OTHER', label: 'Other file' },
] as const

type Props = {
  open: boolean
  onClose: () => void
  defaultTab?: TabId
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export function ChoirDocumentsUploadModal({ open, onClose, defaultTab = 'policies' }: Props) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(CATEGORY_BY_TAB[defaultTab])
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [mimeType, setMimeType] = useState<string | undefined>()
  const [readingFile, setReadingFile] = useState(false)

  useEffect(() => {
    if (open) setCategory(CATEGORY_BY_TAB[defaultTab])
  }, [open, defaultTab])

  const upload = useMutation({
    mutationFn: () =>
      documentsApi.createChoirDocument({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        mimeType,
      }),
    onSuccess: () => {
      toast.success('Document saved')
      setTitle('')
      setDescription('')
      setFileName('')
      setFileUrl('')
      setMimeType(undefined)
      qc.invalidateQueries({ queryKey: ['choir-documents'] })
      onClose()
    },
    onError: () => toast.error('Could not save document'),
  })

  async function onPickFile(file: File | undefined) {
    if (!file) return
    setReadingFile(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setFileName(file.name)
      setFileUrl(dataUrl)
      setMimeType(file.type || undefined)
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '))
      }
    } catch {
      toast.error('Could not read that file')
    } finally {
      setReadingFile(false)
    }
  }

  if (!open) return null

  const inputClass =
    'w-full px-3 py-2.5 text-sm rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-xl border border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-semibold flex items-center gap-2">
            <Upload size={16} /> Upload document
          </p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-raised">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description (optional)"
            className={`${inputClass} resize-none`}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.md"
              onChange={(e) => void onPickFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={readingFile}
              className="w-full px-3 py-2.5 text-sm font-semibold rounded-lg border border-dashed border-border hover:bg-surface-raised disabled:opacity-60"
            >
              {readingFile ? 'Reading file…' : fileName ? `Chosen: ${fileName}` : 'Choose file from device'}
            </button>
            <p className="text-xs text-text-muted text-center">or paste a link</p>
            <input
              type="url"
              value={fileUrl.startsWith('data:') ? '' : fileUrl}
              onChange={(e) => {
                setFileUrl(e.target.value)
                setMimeType(undefined)
                if (!fileName.trim() && e.target.value) {
                  const leaf = e.target.value.split('/').pop()?.split('?')[0]
                  if (leaf) setFileName(decodeURIComponent(leaf))
                }
              }}
              placeholder="https://… (optional if you chose a file)"
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-border"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => upload.mutate()}
              disabled={
                upload.isPending
                || readingFile
                || !title.trim()
                || !fileName.trim()
                || !fileUrl.trim()
              }
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary-700 text-white disabled:opacity-60"
            >
              {upload.isPending ? 'Saving…' : 'Save document'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
