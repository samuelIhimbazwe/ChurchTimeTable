'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores'
import { useTourStore } from '@/stores/tour'
import { authApi } from '@/lib/api'
import { resolveTourPersona } from '@/lib/tour/personas'
import { stepsForPersona } from '@/lib/tour/steps'
import {
  clearWelcomeDeferral,
  deferWelcome,
  isWelcomeDeferred,
} from '@/lib/tour/storage'
import { WelcomeTourModal } from './WelcomeTourModal'
import { GuidedTour } from './GuidedTour'

export function ProductTourProvider() {
  const router = useRouter()
  const pathname = usePathname()
  const qc = useQueryClient()

  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete)

  const active = useTourStore((s) => s.active)
  const persona = useTourStore((s) => s.persona)
  const startTour = useTourStore((s) => s.startTour)
  const setStepIndex = useTourStore((s) => s.setStepIndex)

  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const pendingStartRef = useRef(false)
  const navigatedRef = useRef(false)

  const resolvedPersona = user
    ? resolveTourPersona(user.role, user.permissions)
    : 'member'

  const completeOnboarding = useMutation({
    mutationFn: () => authApi.completeOnboarding(),
    onSuccess: () => {
      setOnboardingComplete(true)
      qc.invalidateQueries({ queryKey: ['member-portal'] })
      qc.invalidateQueries({ queryKey: ['auth'] })
    },
  })

  const markComplete = useCallback(() => {
    if (!user?.onboardingComplete) {
      completeOnboarding.mutate()
    }
  }, [user?.onboardingComplete, completeOnboarding])

  const navigateForStep = useCallback(
    (index: number, p: typeof resolvedPersona) => {
      const steps = stepsForPersona(p)
      const step = steps[index]
      if (step?.route && pathname !== step.route) {
        navigatedRef.current = true
        router.push(step.route)
      }
    },
    [pathname, router],
  )

  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (active) return

    if (
      !user.onboardingComplete
      && !isWelcomeDeferred()
      && !welcomeOpen
    ) {
      setWelcomeOpen(true)
    }
  }, [isAuthenticated, user, active, welcomeOpen])

  useEffect(() => {
    if (!active || !persona || !pendingStartRef.current) return
    if (navigatedRef.current) {
      const steps = stepsForPersona(persona)
      const step = steps[0]
      if (step?.route && pathname === step.route) {
        pendingStartRef.current = false
        navigatedRef.current = false
        setStepIndex(0)
      }
      return
    }
    pendingStartRef.current = false
  }, [active, persona, pathname, setStepIndex])

  useEffect(() => {
    if (!active || !persona) return
    const steps = stepsForPersona(persona)
    const stepIndex = useTourStore.getState().stepIndex
    const step = steps[stepIndex]
    if (step?.route && pathname !== step.route) {
      router.push(step.route)
    }
  }, [active, persona, pathname, router])

  const handleStart = () => {
    setWelcomeOpen(false)
    clearWelcomeDeferral()
    pendingStartRef.current = true
    startTour(resolvedPersona)
    navigateForStep(0, resolvedPersona)
  }

  const handleDefer = () => {
    setWelcomeOpen(false)
    deferWelcome()
  }

  const handleSkipWelcome = () => {
    setWelcomeOpen(false)
    markComplete()
  }

  const handleTourComplete = () => {
    markComplete()
  }

  const handleTourSkip = () => {
    /* User ended early — do not mark onboarding complete unless they skipped welcome */
  }

  if (!isAuthenticated || !user) return null

  return (
    <>
      <WelcomeTourModal
        open={welcomeOpen}
        persona={resolvedPersona}
        userName={user.name}
        onStart={handleStart}
        onDefer={handleDefer}
        onSkip={handleSkipWelcome}
      />
      {active && persona && (
        <GuidedTour
          persona={persona}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </>
  )
}

/** Call from Help panel to replay the guided tour. */
export function startProductTourReplay() {
  const user = useAuthStore.getState().user
  if (!user) return
  const persona = resolveTourPersona(user.role, user.permissions)
  clearWelcomeDeferral()
  useTourStore.getState().startTour(persona, true)
}
