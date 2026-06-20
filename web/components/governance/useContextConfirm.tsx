'use client'

import { useCallback, useState } from 'react'
import { ContextConfirmDialog, type ContextConfirmOptions } from './ContextConfirmDialog'

export function useContextConfirm() {
  const [state, setState] = useState<{
    open: boolean
    options: ContextConfirmOptions | null
    resolve: ((value: boolean) => void) | null
  }>({ open: false, options: null, resolve: null })

  const confirm = useCallback((options: ContextConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, options, resolve })
    })
  }, [])

  const close = useCallback((result: boolean) => {
    setState((s) => {
      s.resolve?.(result)
      return { open: false, options: null, resolve: null }
    })
  }, [])

  const dialog = state.options ? (
    <ContextConfirmDialog
      open={state.open}
      title={state.options.title}
      description={state.options.description}
      confirmLabel={state.options.confirmLabel}
      cancelLabel={state.options.cancelLabel}
      variant={state.options.variant}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null

  return { confirm, dialog }
}
