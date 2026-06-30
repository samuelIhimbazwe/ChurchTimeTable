'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  contributionsApi,
  financeApi,
  memberPortalApi,
  choirSchedulingApi,
  choirServiceOpsApi,
} from '@/lib/api'
import { Card } from '@/components/shared'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import {
  dismissChoirOnboarding,
  isChoirOnboardingCelebrated,
  markChoirOnboardingCelebrated,
  shouldShowChoirOnboarding,
  type ChoirOnboardingStep,
} from '@/lib/choir/choir-onboarding'
import { CheckCircle2, Circle, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OnboardingCelebration } from '@/components/member/OnboardingCelebration'

type Props = {
  choirId: string
}

function upcomingPrepRange() {
  const now = new Date()
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59)
  return { from: now.toISOString(), to: to.toISOString() }
}

export function ChoirOnboardingChecklist({ choirId }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [celebrationDismissed, setCelebrationDismissed] = useState(() =>
    isChoirOnboardingCelebrated(choirId),
  )
  const prepRange = useMemo(() => upcomingPrepRange(), [])

  const { data: home } = useQuery({
    queryKey: ['member-portal-home'],
    queryFn: memberPortalApi.getHome,
  })

  const { data: myFamily } = useQuery({
    queryKey: ['choir-my-family', choirId],
    queryFn: () => memberPortalApi.getChoirMyFamily(choirId),
    retry: false,
  })

  const { data: totals } = useQuery({
    queryKey: ['member-contribution-totals'],
    queryFn: () => financeApi.getMyContributionTotals(),
  })

  const { data: prepServices } = useQuery({
    queryKey: ['member-service-preparation', choirId, prepRange],
    queryFn: () => choirServiceOpsApi.listMemberPreparation(choirId, prepRange),
    enabled: !!choirId,
  })

  const { data: memberDash } = useQuery({
    queryKey: ['choir-member-dashboard', choirId],
    queryFn: () => choirSchedulingApi.getMemberDashboard(choirId),
    enabled: !!choirId,
  })

  const { data: claims } = useQuery({
    queryKey: ['my-contributions-list', { limit: 5 }],
    queryFn: () => contributionsApi.listMine({ limit: 5 }),
  })

  const steps = useMemo<ChoirOnboardingStep[]>(() => {
    const profileDone = Boolean(
      home?.welcome?.firstName?.trim() && home?.welcome?.lastName?.trim(),
    )
    const familyDone = Boolean(myFamily?.family?.id)
    const prepDone = (prepServices?.length ?? 0) > 0
    const givingDone =
      (totals?.byCampaign?.length ?? 0) > 0 || (claims?.items?.length ?? 0) > 0
    const dash = memberDash as Record<string, unknown> | undefined
    const pendingAssignments = Array.isArray(dash?.pendingAcceptance)
      ? dash.pendingAcceptance.length
      : 0
    const assignmentsDone = pendingAssignments === 0 && prepDone

    return [
      {
        id: 'profile',
        label: 'Complete your profile',
        description: 'Add your name so leaders know who you are.',
        href: '/portal/profile',
        done: profileDone,
      },
      {
        id: 'family',
        label: 'Connect your family',
        description: 'See family members and shared giving in one place.',
        href: membershipOfficePath(choirId, 'family'),
        done: familyDone,
      },
      {
        id: 'prep',
        label: 'Review service preparation',
        description: 'Check songs and notes for upcoming services.',
        href: membershipOfficePath(choirId, 'music'),
        done: prepDone,
      },
      {
        id: 'giving',
        label: 'Set a giving goal',
        description: 'Track your contribution toward choir campaigns.',
        href: membershipOfficePath(choirId, 'giving'),
        done: givingDone,
      },
      {
        id: 'assignments',
        label: 'Confirm your assignments',
        description: 'Accept or decline upcoming service roles.',
        href: membershipOfficePath(choirId, 'obligations'),
        done: assignmentsDone,
      },
    ]
  }, [choirId, home, myFamily, prepServices, totals, claims, memberDash])

  const visible =
    !dismissed && shouldShowChoirOnboarding(steps, choirId)

  const completed = steps.filter((s) => s.done).length
  const allDone = completed === steps.length
  const showCelebration = allDone && !celebrationDismissed && !isChoirOnboardingCelebrated(choirId)

  if (showCelebration) {
    return (
      <OnboardingCelebration
        show
        onDismiss={() => {
          markChoirOnboardingCelebrated(choirId)
          dismissChoirOnboarding(choirId)
          setCelebrationDismissed(true)
          setDismissed(true)
        }}
      />
    )
  }

  if (!visible) return null

  const pct = Math.round((completed / steps.length) * 100)

  return (
    <Card accent="gold" padding="md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-gold-700 shrink-0" />
            <div>
              <p className="font-semibold text-text-primary">Getting started in choir</p>
              <p className="text-xs text-text-muted mt-0.5">
                {completed} of {steps.length} complete · {pct}%
              </p>
            </div>
          </div>

          <div className="h-1.5 rounded-full bg-surface-overlay overflow-hidden">
            <div
              className="h-full bg-gold-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ul className="space-y-2">
            {steps.map((step) => (
              <li key={step.id}>
                <Link
                  href={step.href}
                    className={cn(
                    'interactive-link flex items-start gap-2.5 rounded-lg px-2 py-1.5 -mx-2',
                    step.done ? 'opacity-70' : '',
                  )}
                >
                  {step.done ? (
                    <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={16} className="text-text-muted shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className={cn(
                      'text-sm',
                      step.done ? 'text-text-muted line-through' : 'font-medium text-text-primary',
                    )}>
                      {step.label}
                    </p>
                    {!step.done && (
                      <p className="text-xs text-text-muted">{step.description}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => {
              dismissChoirOnboarding(choirId)
              setDismissed(true)
            }}
            className="text-xs font-semibold text-text-muted hover:text-text-primary"
          >
            Dismiss checklist
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            dismissChoirOnboarding(choirId)
            setDismissed(true)
          }}
          className="text-text-muted hover:text-text-primary shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </Card>
  )
}
