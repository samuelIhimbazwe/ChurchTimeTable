'use client'

import { Heart } from 'lucide-react'
import { SheetModal } from '@/components/shared/SheetModal'
import { ConfettiBurst } from '@/components/member/ConfettiBurst'
import { formatCurrency } from '@/lib/utils/format'

type Props = {
  open: boolean
  onClose: () => void
  amount?: number
  campaignName?: string
}

export function ContributionThankYou({ open, onClose, amount, campaignName }: Props) {
  return (
    <>
      {open && <ConfettiBurst active />}
      <SheetModal open={open} onClose={onClose} title="Thank you" maxWidth="sm">
        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-gold-100 flex items-center justify-center">
            <Heart size={28} className="text-gold-700" />
          </div>
          <div>
            <p className="font-display text-xl text-text-primary">Your gift matters</p>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              {amount != null && campaignName
                ? `Thank you for recording ${formatCurrency(amount)} toward ${campaignName}. Your family head will review and confirm.`
                : 'Thank you for recording your contribution. Your family head will review and confirm.'}
            </p>
          </div>
          <p className="text-xs text-text-muted italic">
            &ldquo;God loves a cheerful giver.&rdquo; — 2 Corinthians 9:7
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-sm font-semibold bg-primary-700 text-white rounded-xl hover:bg-primary-800 touch-target"
          >
            Continue
          </button>
        </div>
      </SheetModal>
    </>
  )
}
