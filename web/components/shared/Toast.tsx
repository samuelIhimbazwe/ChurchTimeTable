'use client'

import { useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id:       string
  type:     ToastType
  title:    string
  message?: string
  duration?: number   // ms; 0 = persistent
}

interface ToastStore {
  toasts:  Toast[]
  add:     (t: Omit<Toast, 'id'>) => void
  remove:  (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (t) =>
    set((s) => ({
      toasts: [
        ...s.toasts.slice(-2),   // max 3 visible
        { ...t, id: crypto.randomUUID() },
      ],
    })),
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/* Convenience helpers — import these in components */
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().add({ type: 'success', title, message, duration: 3000 }),
  error: (title: string, message?: string) =>
    useToastStore.getState().add({ type: 'error', title, message, duration: 0 }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().add({ type: 'warning', title, message, duration: 6000 }),
  info: (title: string, message?: string) =>
    useToastStore.getState().add({ type: 'info', title, message, duration: 4000 }),
}

const ICONS = {
  success: CheckCircle2,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
}

const STYLES = {
  success: 'border-success bg-success-light text-success',
  error:   'border-danger  bg-danger-light  text-danger',
  warning: 'border-warning bg-warning-light text-warning',
  info:    'border-info    bg-info-light    text-info',
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove)
  const Icon   = ICONS[t.type]

  useEffect(() => {
    if (!t.duration) return
    const timer = setTimeout(() => remove(t.id), t.duration)
    return () => clearTimeout(timer)
  }, [t.id, t.duration, remove])

  return (
    <div className={cn(
      'flex items-start gap-3 w-80 px-4 py-3 rounded-lg border shadow-overlay',
      'animate-page-enter',
      STYLES[t.type],
    )}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{t.title}</p>
        {t.message && (
          <p className="text-xs mt-0.5 opacity-80">{t.message}</p>
        )}
      </div>
      <button
        onClick={() => remove(t.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
