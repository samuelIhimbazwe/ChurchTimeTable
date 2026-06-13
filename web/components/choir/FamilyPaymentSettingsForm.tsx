'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { familiesApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card } from '@/components/shared'

type Props = {
  familyId: string
  initial: {
    paymentMomoNumber?: string | null
    paymentMomoAccountName?: string | null
    paymentBankAccount?: string | null
    paymentBankName?: string | null
    paymentInstructions?: string | null
  }
}

export function FamilyPaymentSettingsForm({ familyId, initial }: Props) {
  const qc = useQueryClient()
  const [momoNumber, setMomoNumber] = useState(initial.paymentMomoNumber ?? '')
  const [momoName, setMomoName] = useState(initial.paymentMomoAccountName ?? '')
  const [bankAccount, setBankAccount] = useState(initial.paymentBankAccount ?? '')
  const [bankName, setBankName] = useState(initial.paymentBankName ?? '')
  const [instructions, setInstructions] = useState(initial.paymentInstructions ?? '')

  const save = useMutation({
    mutationFn: () =>
      familiesApi.updatePaymentInstructions(familyId, {
        paymentMomoNumber: momoNumber.trim() || null,
        paymentMomoAccountName: momoName.trim() || null,
        paymentBankAccount: bankAccount.trim() || null,
        paymentBankName: bankName.trim() || null,
        paymentInstructions: instructions.trim() || null,
      }),
    onSuccess: () => {
      toast.success('Payment details saved', 'Members will see these when paying.')
      qc.invalidateQueries({ queryKey: ['family-detail', familyId] })
      qc.invalidateQueries({ queryKey: ['family-payment-history', familyId] })
      qc.invalidateQueries({ queryKey: ['choir-my-family'] })
      qc.invalidateQueries({ queryKey: ['contribution-submit-context'] })
    },
    onError: () => toast.error('Could not save payment details'),
  })

  return (
    <Card padding="md">
      <p className="font-semibold mb-1">Family payment account</p>
      <p className="text-xs text-text-muted mb-4">
        Members pay choir contributions to these details, then submit a claim for you to confirm.
      </p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">MoMo number</label>
            <input
              value={momoNumber}
              onChange={(e) => setMomoNumber(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface"
            />
          </div>
          <div>
            <label className="text-xs font-medium">MoMo account name</label>
            <input
              value={momoName}
              onChange={(e) => setMomoName(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Bank account</label>
            <input
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Bank name</label>
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium">Extra instructions</label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={save.isPending}
          className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
        >
          {save.isPending ? 'Saving…' : 'Save payment details'}
        </button>
      </form>
    </Card>
  )
}
