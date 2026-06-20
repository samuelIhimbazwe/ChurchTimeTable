'use client'

import { CelebrationMoment } from '@/components/member/CelebrationMoment'

type Props = {
  show: boolean
  onDismiss: () => void
}

export function OnboardingCelebration({ show, onDismiss }: Props) {
  return (
    <CelebrationMoment
      show={show}
      title="You're all set!"
      message="Great work completing your choir onboarding checklist. You're ready to serve."
      onDismiss={onDismiss}
      accent="gold"
    />
  )
}
