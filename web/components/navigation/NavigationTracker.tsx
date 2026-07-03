'use client'

import { useTrackPage } from '@/lib/navigation/use-track-page'

/** Tracks route visits for command palette recents. */
export function NavigationTracker() {
  useTrackPage()
  return null
}
