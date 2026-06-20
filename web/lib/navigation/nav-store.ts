import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NavPageEntry = {
  path: string
  label: string
  visitedAt: number
}

export type PinnedPage = {
  path: string
  label: string
}

const MAX_RECENT = 12

interface NavStore {
  recentPages: NavPageEntry[]
  pinnedPages: PinnedPage[]
  trackVisit: (path: string, label: string) => void
  togglePin: (path: string, label: string) => void
  isPinned: (path: string) => boolean
  removePin: (path: string) => void
}

export const useNavStore = create<NavStore>()(
  persist(
    (set, get) => ({
      recentPages: [],
      pinnedPages: [],

      trackVisit: (path, label) => {
        const normalized = path.split('?')[0]
        if (normalized === '/' || normalized === '/login') return
        set((s) => {
          if (s.recentPages[0]?.path === normalized && s.recentPages[0]?.label === label) {
            return s
          }
          const filtered = s.recentPages.filter((p) => p.path !== normalized)
          const next: NavPageEntry[] = [
            { path: normalized, label, visitedAt: Date.now() },
            ...filtered,
          ].slice(0, MAX_RECENT)
          return { recentPages: next }
        })
      },

      togglePin: (path, label) => {
        const normalized = path.split('?')[0]
        if (get().isPinned(normalized)) {
          get().removePin(normalized)
        } else {
          set((s) => ({
            pinnedPages: [...s.pinnedPages, { path: normalized, label }].slice(0, 8),
          }))
        }
      },

      isPinned: (path) => {
        const normalized = path.split('?')[0]
        return get().pinnedPages.some((p) => p.path === normalized)
      },

      removePin: (path) => {
        const normalized = path.split('?')[0]
        set((s) => ({
          pinnedPages: s.pinnedPages.filter((p) => p.path !== normalized),
        }))
      },
    }),
    { name: 'cmms-nav' },
  ),
)
