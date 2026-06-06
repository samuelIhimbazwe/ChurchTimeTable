'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Users, Calendar, Music, Home } from 'lucide-react'
import { useSearch } from '@/lib/hooks'

const TYPE_ICON: Record<string, React.ElementType> = {
  member:     Users,
  occurrence: Calendar,
  activity:   Music,
  choir:      Music,
  family:     Home,
}

interface SearchModalProps {
  open:    boolean
  onClose: () => void
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter()
  const { query, setQuery, clear, data: results, isLoading } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else clear()
  }, [open, clear])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleSelect(link: string) {
    router.push(link)
    onClose()
    clear()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
      <div
        className="absolute inset-0 bg-primary-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-surface rounded-xl shadow-modal border border-border overflow-hidden animate-page-enter">

        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search members, services, choirs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {query && (
            <button onClick={clear} className="text-text-muted hover:text-text-primary transition-colors">
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline text-xs font-mono bg-surface-raised border border-border px-1.5 py-0.5 rounded text-text-muted">
            esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-text-muted text-sm">Type at least 2 characters to search…</p>
            </div>
          ) : isLoading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-text-muted text-sm">Searching…</p>
            </div>
          ) : (results?.length ?? 0) === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-text-muted text-sm">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <ul>
              {results?.map((r) => {
                const Icon = TYPE_ICON[r.type] ?? Search
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => handleSelect(r.link)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-raised transition-colors text-left"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-overlay shrink-0">
                        <Icon size={15} className="text-primary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{r.title}</p>
                        {r.subtitle && (
                          <p className="text-xs text-text-muted truncate">{r.subtitle}</p>
                        )}
                      </div>
                      <span className="text-xs text-text-muted capitalize shrink-0">{r.type}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}
