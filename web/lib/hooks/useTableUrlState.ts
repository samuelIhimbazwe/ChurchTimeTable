'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type UrlStateConfig<T extends string> = {
  keys: Record<T, string>
  defaults: Record<T, string>
}

export function useTableUrlState<T extends string>(config: UrlStateConfig<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const configRef = useRef(config)
  configRef.current = config

  const read = useCallback(() => {
    const { keys, defaults } = configRef.current
    const state = { ...defaults }
    for (const key of Object.keys(keys) as T[]) {
      const param = keys[key]
      const val = searchParams.get(param)
      if (val != null) state[key] = val
    }
    return state
  }, [searchParams])

  const [state, setState] = useState(read)

  useEffect(() => {
    setState(read())
  }, [read])

  const setField = useCallback(
    (key: T, value: string) => {
      const { keys, defaults } = configRef.current
      const next = { ...state, [key]: value }
      setState(next)
      const params = new URLSearchParams(searchParams.toString())
      const param = keys[key]
      if (!value || value === defaults[key]) {
        params.delete(param)
      } else {
        params.set(param, value)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [state, searchParams, router, pathname],
  )

  return { state, setField }
}
