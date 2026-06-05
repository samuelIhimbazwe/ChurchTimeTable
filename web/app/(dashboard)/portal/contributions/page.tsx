'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contributionsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, CardHeader, CardTitle, Badge, SkeletonCard } from '@/components/shared'
import { formatDate } from '@/lib/utils/format'
import { PlusCircle, Download } from 'lucide-react'

const CONTRIBUTION_TYPES = [
  'Monthly Dues', 'Special Offering', 'Building Fund',
  'Welfare Fund', 'Choir Fund', 'Other',
]

const STATUS_BADGE: Record<string, 'status-pending' | 'status-present' | 'status-absent'> = {
  PENDING:  'status-pending',
  APPROVED: 'status-present',
  REJECTED: 'status-absent',
}

export default function ContributionsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    amount: '', type: 'Monthly Dues', month: '', note: '',
  })

  const { data: contributions, isLoading } = useQuery({
    queryKey: ['contributions', 'mine'],
    queryFn:  contributionsApi.getMine,
  })

  const submit = useMutation({
    mutationFn: () => contributionsApi.submitMine({
      amount:   parseFloat(form.amount),
      type:     form.type,
      month:    form.month,
      note:     form.note || undefined,
      currency: 'RWF',
    }),
    onSuccess: () => {
      toast.success('Contribution submitted', 'Awaiting approval.')
      qc.invalidateQueries({ queryKey: ['contributions', 'mine'] })
      setShowForm(false)
      setForm({ amount: '', type: 'Monthly Dues', month: '', note: '' })
    },
    onError: () => toast.error('Submission failed', 'Please try again.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.month) return
    submit.mutate()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">
            My Contributions
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            History and monthly submission
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => contributionsApi.exportPdf()}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors text-text-secondary"
          >
            <Download size={15} /> Export
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors shadow-card"
          >
            <PlusCircle size={15} /> Submit
          </button>
        </div>
      </div>

      {/* Submission form */}
      {showForm && (
        <Card accent="gold" padding="md">
          <CardHeader>
            <CardTitle>Submit Contribution</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">
                  Amount (RWF)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="5000"
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">
                  Month
                </label>
                <input
                  type="month"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                {CONTRIBUTION_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Note (optional)
              </label>
              <textarea
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Any additional information…"
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submit.isPending}
                className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-60"
              >
                {submit.isPending ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* History */}
      {isLoading ? (
        <SkeletonCard rows={4} />
      ) : (contributions?.length ?? 0) === 0 ? (
        <Card padding="md">
          <p className="text-center text-text-muted py-8">
            No contributions yet. Submit your first one above.
          </p>
        </Card>
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-border">
            {contributions?.map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-raised transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{c.type}</p>
                  <p className="text-xs text-text-muted">
                    {c.month} · {formatDate(c.submittedAt)}
                  </p>
                </div>
                <span className="font-display font-bold text-xl text-text-primary shrink-0">
                  {c.amount.toLocaleString()} {c.currency}
                </span>
                <Badge variant={STATUS_BADGE[c.status]}>
                  {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
