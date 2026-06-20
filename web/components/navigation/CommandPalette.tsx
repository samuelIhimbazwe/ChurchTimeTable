'use client'



import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import {

  Search, X, Star, ArrowRight, Moon, Sun,

  User, Users, Calendar, Music, Mic2, Heart, Wallet,

  FileText, Megaphone, ClipboardList,

} from 'lucide-react'

import { useSearch } from '@/lib/hooks'

import { useTranslations } from '@/lib/i18n'

import { useUIStore } from '@/stores/index'

import { useNavStore } from '@/lib/navigation/nav-store'

import {

  STATIC_COMMANDS,

  filterCommands,

  type CommandItem,

} from '@/lib/navigation/command-routes'

import {

  SEARCH_SCOPES,

  filterSearchByScope,

  POPULAR_SEARCH_HINTS,

  type SearchScope,

} from '@/lib/search/search-scopes'

import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

import { cn } from '@/lib/utils'



const ENTITY_ICON: Record<string, React.ElementType> = {

  member: User,

  family: Users,

  joinRequest: User,

  invitation: User,

  event: Calendar,

  assignment: Calendar,

  schedule: Calendar,

  rehearsal: Calendar,

  occurrence: Calendar,

  song: Music,

  songCategory: Music,

  choir: Mic2,

  welfareCase: Heart,

  welfareCategory: Heart,

  welfareAssistance: Heart,

  contribution: Wallet,

  ministryFinance: Wallet,

  broadcast: Megaphone,

  choirDocument: FileText,

  choirMeeting: ClipboardList,

  activity: ClipboardList,

}



function iconForResult(entityType?: string, type?: string): React.ElementType {

  if (entityType && ENTITY_ICON[entityType]) return ENTITY_ICON[entityType]

  if (type && ENTITY_ICON[type]) return ENTITY_ICON[type]

  return Search

}



type Props = {

  open: boolean

  onClose: () => void

  onOpenNotifications?: () => void

}



export function CommandPalette({ open, onClose, onOpenNotifications }: Props) {

  const router = useRouter()

  const { query, setQuery, clear, data: searchResults, isLoading } = useSearch()

  const inputRef = useRef<HTMLInputElement>(null)

  const dialogRef = useRef<HTMLDivElement>(null)

  const listRef = useRef<HTMLUListElement>(null)

  useFocusTrap(dialogRef, open)

  const { shell: s } = useTranslations()

  const theme = useUIStore((st) => st.theme)

  const setTheme = useUIStore((st) => st.setTheme)

  const recentPages = useNavStore((st) => st.recentPages)

  const pinnedPages = useNavStore((st) => st.pinnedPages)

  const togglePin = useNavStore((st) => st.togglePin)

  const [activeIndex, setActiveIndex] = useState(0)

  const [scope, setScope] = useState<SearchScope>('all')



  useEffect(() => {

    if (open) {

      setTimeout(() => inputRef.current?.focus(), 50)

      setActiveIndex(0)

    } else {

      clear()

      setScope('all')

    }

  }, [open, clear])



  const recentCommands: CommandItem[] = useMemo(

    () =>

      recentPages.slice(0, 6).map((p) => ({

        id: `recent-${p.path}`,

        label: p.label,

        subtitle: p.path,

        href: p.path,

        icon: ArrowRight,

        group: 'Recent' as const,

      })),

    [recentPages],

  )



  const pinnedCommands: CommandItem[] = useMemo(

    () =>

      pinnedPages.map((p) => ({

        id: `pin-${p.path}`,

        label: p.label,

        subtitle: p.path,

        href: p.path,

        icon: Star,

        group: 'Pinned' as const,

      })),

    [pinnedPages],

  )



  const scopedResults = useMemo(

    () => filterSearchByScope(searchResults ?? [], scope),

    [searchResults, scope],

  )



  const searchCommands: CommandItem[] = useMemo(

    () =>

      scopedResults.map((r) => ({

        id: `search-${r.id}`,

        label: r.title,

        subtitle: r.subtitle ?? r.entityType ?? r.type,

        href: r.link,

        icon: iconForResult(r.entityType, r.type),

        group: 'Search' as const,

      })),

    [scopedResults],

  )



  const baseItems = useMemo(() => {

    const themed = STATIC_COMMANDS.map((c) =>

      c.action === 'toggle-theme'

        ? {
            ...c,
            label:
              theme === 'high-contrast'
                ? 'Switch to light theme'
                : theme === 'dark'
                  ? 'Switch to light theme'
                  : 'Switch to dark theme',
            icon: theme === 'dark' || theme === 'high-contrast' ? Sun : Moon,
          }

        : c,

    )

    let items = [...pinnedCommands, ...recentCommands, ...themed]

    if (query.trim().length >= 2 && searchCommands.length > 0) {

      items = [...searchCommands, ...filterCommands(query, items)]

    } else if (query.trim()) {

      items = filterCommands(query, items)

    }

    return items

  }, [pinnedCommands, recentCommands, query, searchCommands, theme])



  useEffect(() => {

    setActiveIndex(0)

  }, [query, scope, baseItems.length])



  const execute = useCallback(

    (item: CommandItem) => {

      if (item.action === 'toggle-theme') {

        setTheme(theme === 'dark' || theme === 'high-contrast' ? 'light' : 'dark')

        onClose()

        return

      }

      if (item.action === 'open-notifications') {

        onOpenNotifications?.()

        onClose()

        return

      }

      if (item.href) {

        router.push(item.href)

        onClose()

        clear()

      }

    },

    [router, onClose, clear, setTheme, theme, onOpenNotifications],

  )



  useEffect(() => {

    if (!open) return

    function handleKey(e: KeyboardEvent) {

      if (e.key === 'Escape') {

        onClose()

        return

      }

      if (e.key === 'ArrowDown') {

        e.preventDefault()

        setActiveIndex((i) => Math.min(i + 1, baseItems.length - 1))

      }

      if (e.key === 'ArrowUp') {

        e.preventDefault()

        setActiveIndex((i) => Math.max(i - 1, 0))

      }

      if (e.key === 'Enter' && baseItems[activeIndex]) {

        e.preventDefault()

        execute(baseItems[activeIndex])

      }

    }

    window.addEventListener('keydown', handleKey)

    return () => window.removeEventListener('keydown', handleKey)

  }, [open, onClose, baseItems, activeIndex, execute])



  useEffect(() => {

    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined

    el?.scrollIntoView({ block: 'nearest' })

  }, [activeIndex])



  if (!open) return null



  const grouped = baseItems.reduce<Record<string, CommandItem[]>>((acc, item) => {

    acc[item.group] = acc[item.group] ?? []

    acc[item.group].push(item)

    return acc

  }, {})



  let flatIndex = 0

  const showScopes = query.trim().length >= 2 && (searchResults?.length ?? 0) > 0



  return (

    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[8vh] sm:pt-[10vh] px-3 sm:px-4">

      <div

        className="absolute inset-0 bg-primary-950/60 backdrop-blur-sm"

        onClick={onClose}

        aria-hidden

      />



      <div

        ref={dialogRef}

        role="dialog"

        aria-modal="true"

        aria-label="Command palette"

        className="relative w-full max-w-xl bg-surface rounded-xl shadow-modal border border-border overflow-hidden animate-page-enter"

      >

        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">

          <Search size={18} className="text-text-muted shrink-0" />

          <input

            ref={inputRef}

            type="text"

            placeholder={s.searchPlaceholder}

            value={query}

            onChange={(e) => setQuery(e.target.value)}

            className="flex-1 text-sm bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"

          />

          {query && (

            <button type="button" onClick={clear} className="text-text-muted hover:text-text-primary">

              <X size={16} />

            </button>

          )}

          <kbd className="hidden sm:inline text-xs font-mono bg-surface-raised border border-border px-1.5 py-0.5 rounded text-text-muted">

            esc

          </kbd>

        </div>



        {showScopes && (

          <div className="px-3 py-2 border-b border-border flex flex-wrap gap-1">

            {SEARCH_SCOPES.map((s) => (

              <button

                key={s.id}

                type="button"

                onClick={() => setScope(s.id)}

                className={cn(

                  'px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-colors',

                  scope === s.id

                    ? 'bg-primary-700 text-white border-primary-700'

                    : 'border-border text-text-muted hover:bg-surface-raised',

                )}

              >

                {s.label}

              </button>

            ))}

          </div>

        )}



        {!query.trim() && (

          <div className="px-4 py-2 border-b border-border">

            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">

              Popular

            </p>

            <div className="flex flex-wrap gap-1.5">

              {POPULAR_SEARCH_HINTS.map((hint) => (

                <button

                  key={hint}

                  type="button"

                  onClick={() => setQuery(hint)}

                  className="px-2.5 py-1 text-xs rounded-full border border-border text-text-muted hover:bg-surface-raised hover:text-text-primary transition-colors"

                >

                  {hint}

                </button>

              ))}

            </div>

          </div>

        )}



        <ul ref={listRef} className="max-h-80 overflow-y-auto py-2">

          {baseItems.length === 0 ? (

            <li className="px-4 py-8 text-center text-sm text-text-muted">

              {query.length >= 2 && isLoading ? s.searching : s.searchNoResults}

            </li>

          ) : (

            Object.entries(grouped).map(([group, items]) => (

              <li key={group}>

                <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">

                  {group}

                </p>

                <ul>

                  {items.map((item) => {

                    const idx = flatIndex++

                    const Icon = item.icon

                    const pinned = item.href ? useNavStore.getState().isPinned(item.href) : false

                    return (

                      <li key={item.id}>

                        <div

                          className={cn(

                            'flex items-center gap-1 w-full',

                            idx === activeIndex && 'bg-primary-50',

                          )}

                        >

                          <button

                            type="button"

                            onClick={() => execute(item)}

                            className="flex-1 flex items-center gap-3 px-4 py-2.5 hover:bg-surface-raised transition-colors text-left min-w-0"

                          >

                            <Icon size={16} className="text-text-muted shrink-0" />

                            <div className="min-w-0 flex-1">

                              <p className="text-sm font-medium text-text-primary truncate">{item.label}</p>

                              {item.subtitle && (

                                <p className="text-xs text-text-muted truncate">{item.subtitle}</p>

                              )}

                            </div>

                          </button>

                          {item.href && (

                            <button

                              type="button"

                              onClick={(e) => {

                                e.stopPropagation()

                                togglePin(item.href!, item.label)

                              }}

                              className="p-2 mr-2 rounded text-text-muted hover:text-gold-600"

                              aria-label={pinned ? 'Unpin page' : 'Pin page'}

                            >

                              <Star size={14} className={pinned ? 'fill-gold-500 text-gold-500' : ''} />

                            </button>

                          )}

                        </div>

                      </li>

                    )

                  })}

                </ul>

              </li>

            ))

          )}

        </ul>



        <div className="px-4 py-2 border-t border-border bg-surface-raised/50 flex gap-4 text-[10px] text-text-muted">

          <span>↑↓ navigate</span>

          <span>↵ open</span>

          <span>★ pin</span>

        </div>

      </div>

    </div>

  )

}


