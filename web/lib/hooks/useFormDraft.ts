'use client'

import { useEffect, useRef } from 'react'

export function useFormDraft<T extends Record<string, unknown>>(
  key: string,
  values: T,
  enabled = true,
) {
  const isFirst = useRef(true)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    const t = window.setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(values))
    }, 600)
    return () => window.clearTimeout(t)
  }, [key, values, enabled])

  function loadDraft(): Partial<T> | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as Partial<T>) : null
    } catch {
      return null
    }
  }

  function clearDraft() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  }

  return { loadDraft, clearDraft }
}
