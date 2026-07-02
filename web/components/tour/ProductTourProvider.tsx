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
import { markTourProgrammaticNav, tourProgrammaticNavRef } from '@/lib/tour/navigation'
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
  const stepIndex = useTourStore((s) => s.stepIndex)
  const startTour = useTourStore((s) => s.startTour)
  const endTour = useTourStore((s) => s.endTour)

  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const prevPathnameRef = useRef(pathname)
  const welcomePromptedRef = useRef(false)

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

  const goToStepRoute = useCallback(
    (index: number, p: typeof resolvedPersona) => {
      const steps = stepsForPersona(p)
      const step = steps[index]
      if (step?.route && pathname !== step.route) {
        markTourProgrammaticNav()
        router.push(step.route)
      }
    },
    [pathname, router],
  )

  useEffect(() => {
    if (!isAuthenticated || !user || active || welcomePromptedRef.current) return

    if (!user.onboardingComplete && !isWelcomeDeferred()) {
      welcomePromptedRef.current = true
      setWelcomeOpen(true)
    }
  }, [isAuthenticated, user?.id, user?.onboardingComplete, active])

  /* End the tour when the user navigates away manually (e.g. opens Monthly schedule). */
  useEffect(() => {
    if (!active) {
      prevPathnameRef.current = pathname
      return
    }

    if (pathname !== prevPathnameRef.current) {
      if (tourProgrammaticNavRef.current) {
        tourProgrammaticNavRef.current = false
      } else {
        endTour()
      }
      prevPathnameRef.current = pathname
      return
    }

    const steps = persona ? stepsForPersona(persona) : []
    const step = steps[stepIndex]
    if (step?.route && pathname !== step.route) {
      endTour()
    }
  }, [active, persona, stepIndex, pathname, endTour])

  const handleStart = () => {
    setWelcomeOpen(false)
    clearWelcomeDeferral()
    startTour(resolvedPersona)
    goToStepRoute(0, resolvedPersona)
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

  const steps = persona ? stepsForPersona(persona) : []
  const currentStep = steps[stepIndex]
  const tourRouteReady = !currentStep?.route || pathname === currentStep.route

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
      {active && persona && tourRouteReady && (
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
export function startProductTourReplay(push?: (path: string) => void) {
  const user = useAuthStore.getState().user
  if (!user) return
  const persona = resolveTourPersona(user.role, user.permissions)
  const steps = stepsForPersona(persona)
  clearWelcomeDeferral()
  useTourStore.getState().startTour(persona, true)
  const firstRoute = steps[0]?.route
  if (firstRoute) {
    markTourProgrammaticNav()
    if (push) push(firstRoute)
    else window.location.assign(firstRoute)
  }
}
