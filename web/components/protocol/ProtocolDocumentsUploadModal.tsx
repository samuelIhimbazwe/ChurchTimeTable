'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { protocolApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { X, Upload } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
}

const CATEGORIES = ['POLICY', 'FORM', 'GUIDE', 'OTHER'] as const

export function ProtocolDocumentsUploadModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('OTHER')
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')

  const upload = useMutation({
    mutationFn: () =>
      protocolApi.uploadDocument({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
      }),
    onSuccess: () => {
      toast.success('Document uploaded')
      setTitle('')
      setDescription('')
      setFileName('')
      setFileUrl('')
      qc.invalidateQueries({ queryKey: ['protocol-documents'] })
      onClose()
    },
    onError: () => toast.error('Upload failed'),
  })

  if (!open) return null

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
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border resize-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="File name (e.g. handbook.pdf)"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border"
          />
          <input
            type="url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="File URL"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border"
          />
          <div className="flex justify-end gap-2">
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
                upload.isPending || !title.trim() || !fileName.trim() || !fileUrl.trim()
              }
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary-700 text-white disabled:opacity-60"
            >
              {upload.isPending ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
