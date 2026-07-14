'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { choirApi, invitesApi } from '@/lib/api'
import { ApiError } from '@/lib/api/client'
import { toast } from '@/components/shared/Toast'
import { Card, Badge } from '@/components/shared'
import { choirPositionLabel } from '@/lib/constants/choir-positions'
import { ChoirPositionGuide } from '@/components/choir/ChoirPositionGuide'
import { useResolvedChoirScope } from '@/lib/hooks'
import { Copy, KeyRound, Link2, UserPlus, Users } from 'lucide-react'
import { isChoirIdSegment } from '@/lib/choir/paths'
import { formatDate } from '@/lib/utils/format'

type Tab = 'officer' | 'member' | 'invites'

function copyText(text: string, label: string) {
  void navigator.clipboard.writeText(text)
  toast.success(`${label} copied`)
}

function onboardingErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 404) {
      return `${err.message} If this persists after deploy, run demo seed on the API server.`
    }
    return err.message
  }
  return err instanceof Error ? err.message : fallback
}

export function ChoirMemberOnboardingPanel() {
  const qc = useQueryClient()
  const params = useParams()
  const scopedChoirId =
    typeof params.choirId === 'string' && isChoirIdSegment(params.choirId)
      ? params.choirId
      : ''
  const { choirId: resolvedChoirId, choirName } = useResolvedChoirScope()
  const choirId = scopedChoirId || resolvedChoirId
  const [tab, setTab] = useState<Tab>('officer')

  const [officerForm, setOfficerForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    assignedRoleId: '',
  })

  const [memberForm, setMemberForm] = useState({
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

  const [lastInvite, setLastInvite] = useState<{
    inviteUrl?: string
    whatsappMessage?: string
    email: string
  } | null>(null)

  const { data: positionRoles } = useQuery({
    queryKey: ['choir-position-roles', choirId],
    queryFn: () => choirApi.getPositionRoles(choirId!),
    enabled: !!choirId,
  })

  const officerRoles = (positionRoles ?? []).filter((r) => r.name !== 'choir_member')

  const { data: pendingInvites } = useQuery({
    queryKey: ['account-invites', 'CHOIR', 'PENDING'],
    queryFn: () =>
      invitesApi.list({ inviteType: 'CHOIR', status: 'PENDING', limit: 50 }),
    enabled: !!choirId && tab === 'invites',
  })

  const choirInvites = (pendingInvites?.items ?? []).filter(
    (inv) => inv.choir?.id === choirId,
  )

  const createInvite = useMutation({
    mutationFn: () =>
      invitesApi.create({
        email: officerForm.email.trim(),
        firstName: officerForm.firstName.trim(),
        lastName: officerForm.lastName.trim(),
        phone: officerForm.phone.trim() || undefined,
        inviteType: 'CHOIR',
        choirId: choirId!,
        assignedRoleId: officerForm.assignedRoleId,
      }),
    onSuccess: (invite) => {
      toast.success('Officer invite created')
      setLastInvite({
        email: invite.email,
        inviteUrl: invite.inviteUrl,
        whatsappMessage: invite.whatsappMessage,
      })
      setOfficerForm({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        assignedRoleId: officerForm.assignedRoleId,
      })
      qc.invalidateQueries({ queryKey: ['account-invites'] })
    },
    onError: (err: unknown) => {
      toast.error(onboardingErrorMessage(err, 'Could not create invite'))
    },
  })

  const provisionMember = useMutation({
    mutationFn: () =>
      choirApi.provisionMember({
        choirId: choirId!,
        email: memberForm.email.trim(),
        firstName: memberForm.firstName.trim(),
        lastName: memberForm.lastName.trim(),
        phone: memberForm.phone.trim() || undefined,
      }),
    onSuccess: (result) => {
      toast.success(
        result.existingAccount
          ? 'Existing account added to choir'
          : 'Member account created',
      )
      if (result.temporaryPassword) {
        setCredentials({
          email: result.email,
          temporaryPassword: result.temporaryPassword,
          existingAccount: result.existingAccount,
          message: result.message,
        })
      } else {
        toast.info(result.message)
      }
      setMemberForm({ email: '', firstName: '', lastName: '', phone: '' })
      qc.invalidateQueries({ queryKey: ['choir-members'] })
    },
    onError: (err: unknown) => {
      toast.error(onboardingErrorMessage(err, 'Could not create account'))
    },
  })

  const revokeInvite = useMutation({
    mutationFn: (id: string) => invitesApi.revoke(id),
    onSuccess: () => {
      toast.success('Invite revoked')
      qc.invalidateQueries({ queryKey: ['account-invites'] })
    },
    onError: () => toast.error('Could not revoke invite'),
  })

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-center text-text-muted py-12 text-sm">
          Open member onboarding from your choir dashboard.
        </p>
      </Card>
    )
  }

  const tabs: { id: Tab; label: string; icon: typeof UserPlus }[] = [
    { id: 'officer', label: 'Invite officer', icon: Link2 },
    { id: 'member', label: 'Add regular member', icon: Users },
    { id: 'invites', label: 'Pending invites', icon: KeyRound },
  ]

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Member onboarding</h2>
        <p className="text-text-secondary text-sm mt-1">
          {choirName ?? 'Your choir'} — internal accounts only. Officers receive invite links
          with a position; regular members get credentials from you.
        </p>
      </div>

      <Card padding="md" accent="info">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">No public registration.</strong> Members cannot
          self-join from the portal. Invite officers with a leadership role, or create regular
          singer accounts and share temporary login details securely.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id)
              setCredentials(null)
              setLastInvite(null)
            }}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border ${
              tab === id
                ? 'bg-primary-700 text-white border-primary-700'
                : 'bg-surface border-border text-text-primary'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'officer' && (
        <Card padding="md">
          <p className="text-sm font-semibold text-text-primary mb-1">Invite officer or role holder</p>
          <p className="text-xs text-text-muted mb-4">
            They will set their password via the invite link and receive the selected position.
          </p>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!officerForm.assignedRoleId) {
                toast.error('Select a choir position')
                return
              }
              createInvite.mutate()
            }}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="First name"
                value={officerForm.firstName}
                onChange={(e) =>
                  setOfficerForm((s) => ({ ...s, firstName: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
              />
              <input
                type="text"
                required
                placeholder="Last name"
                value={officerForm.lastName}
                onChange={(e) =>
                  setOfficerForm((s) => ({ ...s, lastName: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
              />
            </div>
            <input
              type="email"
              required
              placeholder="Email"
              value={officerForm.email}
              onChange={(e) => setOfficerForm((s) => ({ ...s, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={officerForm.phone}
              onChange={(e) => setOfficerForm((s) => ({ ...s, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
            <div>
              <label className="text-xs font-semibold text-text-primary">
                Choir position (required)
              </label>
              <select
                required
                value={officerForm.assignedRoleId}
                onChange={(e) =>
                  setOfficerForm((s) => ({ ...s, assignedRoleId: e.target.value }))
                }
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm border border-border bg-surface"
              >
                <option value="">Select position…</option>
                {officerRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {choirPositionLabel(role.name)}
                  </option>
                ))}
              </select>
              {officerForm.assignedRoleId && (
                <div className="mt-3">
                  <ChoirPositionGuide
                    roleKey={
                      officerRoles.find((r) => r.id === officerForm.assignedRoleId)?.name ?? ''
                    }
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={createInvite.isPending}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary-700 text-white disabled:opacity-60"
            >
              {createInvite.isPending ? 'Creating invite…' : 'Create invite link'}
            </button>
          </form>

          {lastInvite && (
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <p className="text-sm font-semibold text-text-primary">
                Invite ready for {lastInvite.email}
              </p>
              {lastInvite.inviteUrl ? (
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={lastInvite.inviteUrl}
                    className="flex-1 px-3 py-2 rounded-lg text-xs border border-border bg-surface-raised font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(lastInvite.inviteUrl!, 'Invite link')}
                    className="px-3 py-2 rounded-lg border border-border hover:bg-surface-raised"
                    aria-label="Copy invite link"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  Invite link is delivered by email in production. Check server logs in development.
                </p>
              )}
              {lastInvite.whatsappMessage && (
                <button
                  type="button"
                  onClick={() => copyText(lastInvite.whatsappMessage!, 'WhatsApp message')}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                >
                  Copy WhatsApp message
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      {tab === 'member' && (
        <Card padding="md">
          <p className="text-sm font-semibold text-text-primary mb-1">Add regular choir member</p>
          <p className="text-xs text-text-muted mb-4">
            Creates their account immediately with a temporary password they must change on first login.
          </p>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              provisionMember.mutate()
            }}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="First name"
                value={memberForm.firstName}
                onChange={(e) =>
                  setMemberForm((s) => ({ ...s, firstName: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
              />
              <input
                type="text"
                required
                placeholder="Last name"
                value={memberForm.lastName}
                onChange={(e) =>
                  setMemberForm((s) => ({ ...s, lastName: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
              />
            </div>
            <input
              type="email"
              required
              placeholder="Email (login)"
              value={memberForm.email}
              onChange={(e) => setMemberForm((s) => ({ ...s, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={memberForm.phone}
              onChange={(e) => setMemberForm((s) => ({ ...s, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
            <button
              type="submit"
              disabled={provisionMember.isPending}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary-700 text-white disabled:opacity-60"
            >
              {provisionMember.isPending ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {credentials && (
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <p className="text-sm font-semibold text-text-primary">Share these credentials once</p>
              <p className="text-xs text-text-muted">{credentials.message}</p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2 text-sm">
                <p>
                  <span className="text-text-muted">Email: </span>
                  <span className="font-mono font-semibold">{credentials.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-text-muted">Temporary password: </span>
                  <span className="font-mono font-semibold">{credentials.temporaryPassword}</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        `Email: ${credentials.email}\nPassword: ${credentials.temporaryPassword}`,
                        'Credentials',
                      )
                    }
                    className="p-1 rounded hover:bg-amber-100"
                    aria-label="Copy credentials"
                  >
                    <Copy size={14} />
                  </button>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCredentials(null)}
                className="text-xs font-semibold text-text-muted hover:text-text-primary"
              >
                Dismiss
              </button>
            </div>
          )}
        </Card>
      )}

      {tab === 'invites' && (
        <div className="space-y-3">
          {choirInvites.length === 0 ? (
            <Card padding="md">
              <p className="text-center text-text-muted py-8 text-sm">No pending officer invites.</p>
            </Card>
          ) : (
            choirInvites.map((inv) => (
              <Card key={inv.id} padding="md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-text-primary">
                      {inv.firstName} {inv.lastName}
                    </p>
                    <p className="text-sm text-text-secondary">{inv.email}</p>
                    <p className="text-xs text-text-muted mt-1">
                      Expires {formatDate(inv.expiresAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="status-pending">{inv.status}</Badge>
                    {inv.inviteUrl && (
                      <button
                        type="button"
                        onClick={() => copyText(inv.inviteUrl!, 'Invite link')}
                        className="text-xs font-semibold text-primary-600"
                      >
                        Copy link
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => revokeInvite.mutate(inv.id)}
                      disabled={revokeInvite.isPending}
                      className="text-xs font-semibold text-danger"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
