'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { membersApi, protocolApi } from '@/lib/api'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (memberId: string, memberName?: string) => void
  source?: 'church' | 'protocol'
  placeholder?: string
  disabled?: boolean
  className?: string
}

function memberLabel(row: Record<string, unknown>): string {
  const member = row.member as { firstName?: string; lastName?: string } | undefined
  if (member) {
    return `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
  }
  return `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || 'Unknown'
}

function memberId(row: Record<string, unknown>): string {
  const member = row.member as { id?: string } | undefined
  return String(row.memberId ?? member?.id ?? row.id ?? '')
}

export function ProtocolMemberPicker({
  value,
  onChange,
  source = 'church',
  placeholder = 'Search member…',
  disabled = false,
  className,
}: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const { data: churchData, isLoading: churchLoading } = useQuery({
    queryKey: ['protocol-member-picker-church', search],
    queryFn: () => membersApi.getAll({ search: search || undefined, limit: 20, status: 'ACTIVE' }),
    enabled: source === 'church' && open,
  })

  const { data: protocolData, isLoading: protocolLoading } = useQuery({
    queryKey: ['protocol-member-picker-protocol'],
    queryFn: () => protocolApi.listProtocolMembers(),
    enabled: source === 'protocol' && open,
  })

  const items = useMemo(() => {
    if (source === 'church') {
      return (churchData?.items ?? []).map((m) => ({
        id: m.id,
        name: m.name,
      }))
    }
    const rows = (protocolData ?? []) as Record<string, unknown>[]
    const q = search.trim().toLowerCase()
    return rows
      .map((row) => ({ id: memberId(row), name: memberLabel(row) }))
      .filter((row) => !q || row.name.toLowerCase().includes(q))
      .slice(0, 20)
  }, [source, churchData?.items, protocolData, search])

  const isLoading = source === 'church' ? churchLoading : protocolLoading

  const selectedName = useMemo(() => {
    if (!value) return ''
    return items.find((m) => m.id === value)?.name ?? ''
  }, [value, items])

  useEffect(() => {
    if (!open) setSearch(selectedName || '')
  }, [open, selectedName])

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
          ) : items.length === 0 ? (
            <li className="px-3 py-2 text-sm text-text-muted">No members found.</li>
          ) : (
            items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-surface-raised transition-colors',
                    value === m.id && 'bg-primary-50 text-primary-800 font-medium',
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(m.id, m.name)
                    setSearch(m.name)
                    setOpen(false)
                  }}
                >
                  {m.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
