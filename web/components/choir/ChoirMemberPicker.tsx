'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { useResolvedChoirId } from '@/lib/hooks'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (memberId: string, memberName?: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ChoirMemberPicker({
  value,
  onChange,
  placeholder = 'Search choir member…',
  disabled = false,
  className,
}: Props) {
  const choirId = useResolvedChoirId()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['choir-member-picker', choirId, search],
    queryFn: () => choirApi.getMembers(choirId, { search: search || undefined, limit: 20 }),
    enabled: !!choirId && open,
  })

  const selectedName = useMemo(() => {
    if (!value) return ''
    const match = data?.items?.find((m) => m.memberId === value)
    return match?.name ?? ''
  }, [value, data?.items])

  useEffect(() => {
    if (!open) setSearch(selectedName || '')
  }, [open, selectedName])

  if (!choirId) {
    return (
      <p className="text-sm text-text-muted">
        Open this form from your choir dashboard to search members.
      </p>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={open ? search : (selectedName || search)}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
            if (!e.target.value.trim()) onChange('')
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-border bg-surface shadow-overlay">
          {isLoading ? (
            <li className="px-3 py-2 text-sm text-text-muted">Searching…</li>
          ) : (data?.items?.length ?? 0) === 0 ? (
            <li className="px-3 py-2 text-sm text-text-muted">No members found.</li>
          ) : (
            data?.items?.map((m) => (
              <li key={m.memberId}>
                <button
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-surface-raised transition-colors',
                    value === m.memberId && 'bg-primary-50 text-primary-800 font-medium',
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(m.memberId, m.name)
                    setSearch(m.name)
                    setOpen(false)
                  }}
                >
                  {m.name}
                  {m.voicePart && (
                    <span className="text-text-muted ml-2 text-xs">{m.voicePart}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
