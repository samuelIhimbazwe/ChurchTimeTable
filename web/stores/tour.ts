import { create } from 'zustand'
import type { TourPersona } from '@/lib/tour/types'

interface TourStore {
  active: boolean
  stepIndex: number
  persona: TourPersona | null
  replayMode: boolean
  startTour: (persona: TourPersona, replay?: boolean) => void
  setStepIndex: (index: number) => void
  nextStep: (maxIndex: number) => void
  prevStep: () => void
  endTour: () => void
}

export const useTourStore = create<TourStore>()((set, get) => ({
  active: false,
  stepIndex: 0,
  persona: null,
  replayMode: false,

  startTour: (persona, replay = false) =>
    set({ active: true, stepIndex: 0, persona, replayMode: replay }),

  setStepIndex: (index) => set({ stepIndex: index }),

  nextStep: (maxIndex) => {
    const { stepIndex } = get()
    if (stepIndex >= maxIndex) {
      set({ active: false, stepIndex: 0, persona: null, replayMode: false })
      return
    }
    set({ stepIndex: stepIndex + 1 })
  },

  prevStep: () => {
    const { stepIndex } = get()
    if (stepIndex > 0) set({ stepIndex: stepIndex - 1 })
  },

  endTour: () =>
    set({ active: false, stepIndex: 0, persona: null, replayMode: false }),
}))
