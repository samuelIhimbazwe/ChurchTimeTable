'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ViewAsStore {
  viewAsMember: boolean
  setViewAsMember: (active: boolean) => void
  toggleViewAsMember: () => void
}

export const useViewAsStore = create<ViewAsStore>()(
  persist(
    (set) => ({
      viewAsMember: false,
      setViewAsMember: (viewAsMember) => set({ viewAsMember }),
      toggleViewAsMember: () => set((s) => ({ viewAsMember: !s.viewAsMember })),
    }),
    { name: 'cmms-view-as' },
  ),
)
