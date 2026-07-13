'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { choirApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  AccessRedirectGate,
  Avatar,
  Badge,
  Card,
  SkeletonCard,
  StatTile,
} from '@/components/shared'
import { useResolvedChoirId } from '@/lib/hooks'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import { parseChoirIdFromPath } from '@/lib/choir/paths'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { HandCoins, KeyRound, UserPlus, Users } from 'lucide-react'

export default function ChoirSponsorsPage() {
  const pathname = usePathname()
  const qc = useQueryClient()
  const choirId = useResolvedChoirId()
  const choirIdFromPath = parseChoirIdFromPath(pathname) ?? ''
  const effectiveChoirId = choirId || choirIdFromPath
  const choirCtx = useOptionalChoirDashboardCtx()
  const choirName = choirCtx?.context?.choir.name

  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [credentials, setCredentials] = useState<{
    email: string
    temporaryPassword: string
    existingAccount: boolean
    message: string
  } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['choir-sponsors', effectiveChoirId],
    queryFn: () => choirApi.getSponsors(effectiveChoirId),
    enabled: !!effectiveChoirId,
  })

  const provision = useMutation({
    mutationFn: () =>
      choirApi.provisionSponsor({
        choirId: effectiveChoirId,
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
      }),
    onSuccess: (result) => {
      toast.success(
        result.existingAccount
          ? 'Existing account linked as sponsor'
          : 'Sponsor account created',
      )
      setCredentials({
        email: result.email,
        temporaryPassword: result.temporaryPassword ?? '',
        existingAccount: result.existingAccount,
        message: result.message,
      })
      setForm({ email: '', firstName: '', lastName: '', phone: '' })
      qc.invalidateQueries({ queryKey: ['choir-sponsors', effectiveChoirId] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Could not invite sponsor'
      toast.error(msg)
    },
  })

  const sponsors = data?.sponsors ?? []
  const totals = data?.totals

  return (
    <AccessRedirectGate uiCapability="sponsor-requests-desk">
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Sponsors</h2>
          <p className="text-text-secondary text-sm mt-1">
            Invite and manage external sponsors for {choirName ?? 'your choir'} — list,
            giving totals, and pending gifts. Sponsors use a separate dashboard (songs +
            giving), not singer membership tools.
          </p>
        </div>

        {!effectiveChoirId ? (
          <Card padding="md">
            <p className="text-center text-text-muted py-12 text-sm">
              Open this page from your choir dashboard.
            </p>
          </Card>
        ) : isLoading ? (
          <SkeletonCard rows={5} />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile
                label="Active sponsors"
                value={String(totals?.sponsorCount ?? 0)}
                icon={Users}
              />
              <StatTile
                label="Confirmed giving"
                value={formatCurrency(totals?.confirmedTotal ?? 0)}
                icon={HandCoins}
              />
              <StatTile
                label="Pending gifts"
                value={String(totals?.pendingGiftCount ?? 0)}
                icon={UserPlus}
              />
            </div>

            <Card padding="md">
              <div className="flex items-start gap-3 mb-4">
                <UserPlus size={18} className="text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-text-primary">Invite a sponsor</p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Creates or links an account and activates sponsorship. They will land on
                    the sponsor dashboard after login — not the singer membership home.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="First name"
                  className="px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
                />
                <input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Last name"
                  className="px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
                />
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email"
                  type="email"
                  className="px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Phone (optional)"
                  className="px-3 py-2.5 rounded-lg text-sm bg-surface border border-border"
                />
              </div>

              <button
                type="button"
                disabled={
                  provision.isPending
                  || !form.email.trim()
                  || !form.firstName.trim()
                  || !form.lastName.trim()
                }
                onClick={() => provision.mutate()}
                className="mt-4 px-4 py-2.5 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg disabled:opacity-50"
              >
                {provision.isPending ? 'Inviting…' : 'Invite sponsor'}
              </button>

              {credentials && (
                <div className="mt-4 rounded-lg border border-border bg-surface-raised p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <KeyRound size={15} />
                    {credentials.existingAccount ? 'Account linked' : 'Temporary password'}
                  </div>
                  <p className="text-sm text-text-secondary">{credentials.message}</p>
                  <p className="text-sm text-text-primary">
                    <span className="text-text-muted">Email:</span> {credentials.email}
                  </p>
                  {!credentials.existingAccount && credentials.temporaryPassword && (
                    <p className="text-sm font-mono text-text-primary">
                      {credentials.temporaryPassword}
                    </p>
                  )}
                </div>
              )}
            </Card>

            <Card padding="md">
              <p className="font-semibold text-text-primary mb-1">Sponsor roster</p>
              <p className="text-xs text-text-muted mb-4">
                Confirmed gifts are treasurer-verified sponsor support. Pending gifts await
                confirmation in the treasurer inbox.
              </p>

              {sponsors.length === 0 ? (
                <div className="text-center py-10">
                  <Users size={28} className="text-text-muted mx-auto mb-3" />
                  <p className="text-sm text-text-muted">No sponsors yet. Invite the first one above.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {sponsors.map((s) => {
                    const name = `${s.firstName} ${s.lastName}`.trim()
                    return (
                      <li
                        key={s.sponsorshipId}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border px-3 py-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <Avatar name={name} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text-primary">{name}</p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {s.email ?? 'No email'}
                              {s.phone ? ` · ${s.phone}` : ''}
                            </p>
                            <p className="text-xs text-text-muted mt-1">
                              Sponsoring since {formatDate(s.startedAt)}
                              {s.lastGiftAt ? ` · Last gift ${formatDate(s.lastGiftAt)}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <p className="text-sm font-semibold text-text-primary">
                            {formatCurrency(s.confirmedTotal)}
                          </p>
                          <p className="text-xs text-text-muted">
                            {s.confirmedGiftCount} confirmed gift
                            {s.confirmedGiftCount === 1 ? '' : 's'}
                          </p>
                          {s.pendingGiftCount > 0 && (
                            <Badge variant="status-pending">
                              {s.pendingGiftCount} pending
                            </Badge>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </AccessRedirectGate>
  )
}
