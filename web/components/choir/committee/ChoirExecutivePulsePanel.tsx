'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { Card } from '@/components/shared'
import { toast } from '@/components/shared/Toast'

type Props = {
  choirId: string
  readOnly?: boolean
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Struggling',
  2: 'Needs support',
  3: 'Steady',
  4: 'Strong',
  5: 'Thriving',
}

export function ChoirExecutivePulsePanel({ choirId, readOnly }: Props) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['choir-executive-pulse', choirId],
    queryFn: () => choirApi.getExecutivePulse(choirId),
    enabled: !!choirId,
  })

  const save = useMutation({
    mutationFn: (score: number) => choirApi.upsertExecutivePulse(choirId, { score }),
    onSuccess: () => {
      toast.success('Executive pulse saved')
      qc.invalidateQueries({ queryKey: ['choir-executive-pulse', choirId] })
    },
    onError: () => toast.error('Could not save executive pulse'),
  })

  if (isLoading) {
    return (
      <Card padding="md">
        <p className="text-sm text-text-muted">Loading executive pulse…</p>
      </Card>
    )
  }

  const currentScore = data?.entry?.score ?? null

  return (
    <Card padding="md" id="executive-pulse-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
        Leadership team pulse
      </p>
      <p className="text-sm text-text-secondary mb-4">
        Weekly 1–5 check-in for the executive committee — president, VP, or secretary
        can record once per week.
      </p>

      {!readOnly && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate(score)}
              className={`min-w-[3rem] rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                currentScore === score
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-border hover:bg-surface-raised'
              }`}
            >
              {score}
            </button>
          ))}
        </div>
      )}

      {currentScore != null ? (
        <p className="text-sm text-text-primary">
          This week:{' '}
          <span className="font-semibold">
            {currentScore}/5 — {SCORE_LABELS[currentScore] ?? 'Recorded'}
          </span>
          {data?.entry?.recordedByName && (
            <span className="text-text-muted"> · {data.entry.recordedByName}</span>
          )}
        </p>
      ) : (
        <p className="text-sm text-text-muted">No executive pulse recorded this week yet.</p>
      )}

      {(data?.recent?.length ?? 0) > 1 && (
        <ul className="mt-4 pt-4 border-t border-border text-xs text-text-muted space-y-1">
          {data!.recent.slice(0, 6).map((row) => (
            <li key={row.weekStart} className="flex justify-between gap-3">
              <span>{new Date(row.weekStart).toLocaleDateString()}</span>
              <span>{row.score}/5</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
