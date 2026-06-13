'use client'

import { useRef } from 'react'
import type {
  FamilyContributionDashboard,
  FamilyMemberProgressResponse,
} from '@/lib/api/modules/finance'
import { Card } from '@/components/shared'
import { membersBelowProgressThreshold } from '@/lib/choir/family-progress-desk'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { toast } from '@/components/shared/Toast'
import { Copy, Printer } from 'lucide-react'

type Props = {
  familyName: string
  familyCode?: string | null
  headName?: string | null
  dashboard: FamilyContributionDashboard
  progress: FamilyMemberProgressResponse
}

function buildMeetingPackText(props: Props): string {
  const { familyName, familyCode, headName, dashboard, progress } = props
  const campaign = dashboard.campaign
  const lines = [
    `Family giving meeting pack — ${familyName}${familyCode ? ` (${familyCode})` : ''}`,
    `Generated ${formatDate(new Date().toISOString())}`,
    headName ? `Family head: ${headName}` : '',
    '',
    campaign ? `Campaign: ${campaign.name}` : 'No active campaign',
    campaign?.familyGoalAmount != null
      ? `Family collected: ${formatCurrency(dashboard.collectedEffective)} / ${formatCurrency(campaign.familyGoalAmount)} (${Math.round(dashboard.progressPct ?? 0)}%)`
      : `Family collected: ${formatCurrency(dashboard.collectedEffective)}`,
    `Pending at head: ${dashboard.pendingCount}`,
    '',
    'Member progress:',
    ...progress.items.map((row) => {
      const pct = row.progressPct != null ? `${row.progressPct}%` : '—'
      return `- ${row.memberName}: ${formatCurrency(row.confirmedEffective)} confirmed (${pct})`
    }),
  ]
  return lines.filter(Boolean).join('\n')
}

export function MeetingPackExport({
  familyName,
  familyCode,
  headName,
  dashboard,
  progress,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const belowHalf = membersBelowProgressThreshold(progress.items, 50)
  const campaign = dashboard.campaign

  function handlePrint() {
    window.print()
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        buildMeetingPackText({ familyName, familyCode, headName, dashboard, progress }),
      )
      toast.success('Meeting pack copied to clipboard')
    } catch {
      toast.error('Could not copy summary')
    }
  }

  return (
    <div className="space-y-4">
      {belowHalf.length > 0 && (
        <Card padding="sm" accent="warning">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">Suggested action:</span>{' '}
            {belowHalf.length} member{belowHalf.length === 1 ? '' : 's'} below 50% — discuss follow-up
            at the family gathering.
          </p>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-700 text-white"
        >
          <Printer size={16} />
          Print meeting pack
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-surface-raised"
        >
          <Copy size={16} />
          Copy text summary
        </button>
      </div>

      <div
        ref={printRef}
        id="family-meeting-pack"
        className="rounded-xl border border-border bg-white text-black p-6 space-y-5 print:border-0 print:p-0"
      >
        <header className="border-b border-border pb-4 print:border-black/20">
          <p className="text-xs uppercase tracking-wide text-text-muted print:text-black/60">
            Family giving meeting pack
          </p>
          <h3 className="font-display text-2xl font-bold mt-1">
            {familyName}
            {familyCode ? ` · ${familyCode}` : ''}
          </h3>
          <p className="text-sm text-text-muted mt-1 print:text-black/70">
            {formatDate(new Date().toISOString())}
            {headName ? ` · Head: ${headName}` : ''}
          </p>
        </header>

        <section>
          <h4 className="text-sm font-bold uppercase tracking-wide mb-2">Campaign summary</h4>
          {campaign ? (
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-text-muted print:text-black/60">Campaign</dt>
                <dd className="font-semibold">{campaign.name}</dd>
              </div>
              <div>
                <dt className="text-text-muted print:text-black/60">Family collected</dt>
                <dd className="font-semibold">{formatCurrency(dashboard.collectedEffective)}</dd>
              </div>
              {campaign.familyGoalAmount != null && (
                <div>
                  <dt className="text-text-muted print:text-black/60">Family goal</dt>
                  <dd>{formatCurrency(campaign.familyGoalAmount)}</dd>
                </div>
              )}
              <div>
                <dt className="text-text-muted print:text-black/60">Progress</dt>
                <dd>{Math.round(dashboard.progressPct ?? 0)}%</dd>
              </div>
              <div>
                <dt className="text-text-muted print:text-black/60">Pending at head</dt>
                <dd>{dashboard.pendingCount}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-text-muted">No active campaign.</p>
          )}
        </section>

        <section>
          <h4 className="text-sm font-bold uppercase tracking-wide mb-2">Member progress</h4>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase print:border-black/20">
                <th className="py-2 pr-3">Member</th>
                <th className="py-2 pr-3 text-right">Goal</th>
                <th className="py-2 pr-3 text-right">Confirmed</th>
                <th className="py-2 text-right">Progress</th>
              </tr>
            </thead>
            <tbody>
              {progress.items.map((row) => (
                <tr key={row.memberId} className="border-b border-border print:border-black/10">
                  <td className="py-2 pr-3">
                    {row.memberName}
                    {row.memberNumber ? ` (${row.memberNumber})` : ''}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {row.memberGoalAmount != null ? formatCurrency(row.memberGoalAmount) : '—'}
                  </td>
                  <td className="py-2 pr-3 text-right">{formatCurrency(row.confirmedEffective)}</td>
                  <td className="py-2 text-right">
                    {row.progressPct != null ? `${row.progressPct}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="text-xs text-text-muted print:text-black/60">
          <p>
            Completed goal: {progress.summary.membersCompletedGoal} · Behind:{' '}
            {progress.summary.membersBehindTarget} · No contribution:{' '}
            {progress.summary.membersWithNoContribution}
          </p>
        </section>
      </div>
    </div>
  )
}
