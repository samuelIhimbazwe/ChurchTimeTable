'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onSave: (next: string) => void
  editable?: boolean
  multiline?: boolean
  className?: string
  inputClassName?: string
  title?: string
}

export function EditableBulletinText({
  value,
  onSave,
  editable = false,
  multiline = false,
  className,
  inputClassName,
  title = 'Click to edit',
}: Props) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  if (!editable) {
    return (
      <span className={cn(multiline && 'whitespace-pre-line', className)}>
        {value}
      </span>
    )
  }

  if (editing) {
    const shared = cn(
      'w-full bg-white/90 border border-gold-400 rounded px-1.5 py-1 text-inherit font-inherit leading-inherit focus:outline-none focus:ring-2 focus:ring-gold-400',
      inputClassName,
    )

    if (multiline) {
      return (
        <textarea
          className={cn(shared, 'min-h-[3rem] resize-y')}
          value={draft}
          autoFocus
          rows={Math.max(2, draft.split('\n').length)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false)
            if (draft !== value) onSave(draft)
          }}
        />
      )
    }

    return (
      <input
        className={shared}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          if (draft !== value) onSave(draft)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
    )
  }

  return (
    <button
      type="button"
      title={title}
      className={cn(
        'w-full text-left rounded px-0.5 -mx-0.5 hover:bg-gold-50/80 hover:ring-1 hover:ring-gold-300/80 transition-colors',
        multiline && 'whitespace-pre-line',
        className,
      )}
      onClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
    >
      {value}
    </button>
  )
}
