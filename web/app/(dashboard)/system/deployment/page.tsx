'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { setupApi } from '@/lib/api'
import { ChurchSetupWizard } from '@/components/admin/ChurchSetupWizard'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import {
  Server, CheckCircle2, XCircle, Upload, Bell, RefreshCw,
} from 'lucide-react'

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export default function DeploymentPage() {
  const qc = useQueryClient()

  const { data: setup, isLoading: setupLoading } = useQuery({
    queryKey: ['setup'],
    queryFn:  setupApi.getSetup,
  })

  const { data: status } = useQuery({
    queryKey: ['setup-status'],
    queryFn:  setupApi.getStatus,
  })

  const { data: readiness, isLoading: rLoading } = useQuery({
    queryKey: ['setup-readiness'],
    queryFn:  setupApi.getReadiness,
  })

  const { data: reminders, isLoading: remLoading } = useQuery({
    queryKey: ['reminders-dashboard'],
    queryFn:  setupApi.getRemindersDashboard,
  })

  const { data: goLive } = useQuery({
    queryKey: ['go-live-report'],
    queryFn: setupApi.getGoLiveReport,
  })

  const runReminders = useMutation({
    mutationFn: setupApi.runReminders,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders-dashboard'] })
    },
  })

  const wizardComplete = num(status?.completedSteps ?? status?.progress)
  const readinessScore = num(readiness?.score ?? readiness?.percentage)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Deployment Center</h2>
          <p className="text-text-secondary text-sm mt-1">
            Setup wizard status, readiness checks, and reminders
          </p>
        </div>
        <Link
          href="/admin/import"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"
        >
          <Upload size={15} /> Go to Import
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {setupLoading || rLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Wizard Progress" value={wizardComplete} suffix="%" icon={Server} animate />
            <StatTile label="Readiness Score" value={readinessScore} suffix="%" icon={CheckCircle2} animate />
            <StatTile label="Pending Reminders" value={num(reminders?.pending ?? reminders?.count)} icon={Bell} animate />
            <StatTile label="Setup Steps" value={num(setup?.totalSteps ?? status?.totalSteps)} icon={RefreshCw} animate />
          </>
        )}
      </div>

      <ChurchSetupWizard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardHeader>
            <CardTitle>Setup Wizard</CardTitle>
            <CardDescription>Current deployment configuration</CardDescription>
          </CardHeader>
          {setupLoading ? (
            <SkeletonCard rows={5} />
          ) : (
            <div className="space-y-2 text-sm">
              {Object.entries(setup ?? {}).slice(0, 10).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium text-text-primary truncate max-w-[50%] text-right">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Readiness Checks</CardTitle>
            <CardDescription>
              {rLoading ? '…' : `${readinessScore}% ready`}
            </CardDescription>
          </CardHeader>
          {rLoading ? (
            <SkeletonCard rows={5} />
          ) : (
            <div className="space-y-2">
              {(Array.isArray(readiness?.checks) ? readiness.checks : []).map((c: Record<string, unknown>, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  {(c.passed ?? c.ready)
                    ? <CheckCircle2 size={15} className="text-success shrink-0" />
                    : <XCircle size={15} className="text-danger shrink-0" />}
                  <span className="text-text-primary">{String(c.label ?? c.name ?? `Check ${i + 1}`)}</span>
                  {c.detail != null && (
                    <span className="text-xs text-text-muted ml-auto">{String(c.detail)}</span>
                  )}
                </div>
              ))}
              {!(readiness?.checks as unknown[])?.length && (
                <p className="text-sm text-text-muted">No readiness checks returned.</p>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Go-live report</CardTitle>
          <CardDescription>Pre-launch checklist summary</CardDescription>
        </CardHeader>
        <div className="space-y-2 text-sm">
          {goLive && Object.keys(goLive).length > 0 ? (
            Object.entries(goLive).slice(0, 12).map(([key, val]) => (
              <div key={key} className="flex justify-between gap-3">
                <span className="text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-medium text-text-primary truncate max-w-[50%] text-right">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-text-muted">No go-live report data yet.</p>
          )}
        </div>
      </Card>

      <Card padding="md">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Reminders Dashboard</CardTitle>
              <CardDescription>Outstanding deployment reminders</CardDescription>
            </div>
            <button
              type="button"
              onClick={() => runReminders.mutate()}
              disabled={runReminders.isPending}
              className="text-xs font-semibold text-primary-600 hover:text-primary-800 disabled:opacity-60"
            >
              {runReminders.isPending ? 'Running…' : 'Run now'}
            </button>
          </div>
        </CardHeader>
        {remLoading ? (
          <SkeletonCard rows={4} />
        ) : (
          <div className="space-y-2 text-sm">
            {Object.entries(reminders ?? {}).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-medium text-text-primary">{String(val)}</span>
              </div>
            ))}
            {Object.keys(reminders ?? {}).length === 0 && (
              <p className="text-text-muted">No reminder data available.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
