'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { governanceApi, invitesApi } from '@/lib/api'
import { protocolApi } from '@/lib/api/modules/protocol'
import { toast } from '@/components/shared/Toast'
import { Card, Badge } from '@/components/shared'
import {
  PROTOCOL_COMMITTEE_ROLE_LABELS,
  PROTOCOL_MINISTRY_ID,
} from '@/lib/protocol/constants'
import { Copy, KeyRound, Link2, UserPlus, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

type Tab = 'officer' | 'member' | 'invites'

function copyText(text: string, label: string) {
  void navigator.clipboard.writeText(text)
  toast.success(`${label} copied`)
}

function roleLabel(name: string) {
  return PROTOCOL_COMMITTEE_ROLE_LABELS[name] ?? name.replace(/^protocol_/, '').replace(/_/g, ' ')
}

export function ProtocolMemberOnboardingPanel() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('officer')

  const [officerForm, setOfficerForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    assignedProtocolRoleId: '',
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
    message: string
    delivery?: { email: string; sms: string; whatsapp: string } | null
  } | null>(null)

  const [lastInvite, setLastInvite] = useState<{
    inviteUrl?: string
    whatsappMessage?: string
    email: string
  } | null>(null)

  const { data: committeeScope } = useQuery({
    queryKey: ['protocol-committee', PROTOCOL_MINISTRY_ID],
    queryFn: () => governanceApi.getProtocolScope(PROTOCOL_MINISTRY_ID),
  })

  const officerRoles = (
    (committeeScope as { roles?: Array<{ id: string; name: string }> })?.roles ?? []
  ).filter((r) => r.name !== 'protocol_president')

  const { data: pendingInvites } = useQuery({
    queryKey: ['account-invites', 'PROTOCOL', 'PENDING'],
    queryFn: () =>
      invitesApi.list({ inviteType: 'PROTOCOL', status: 'PENDING', limit: 50 }),
    enabled: tab === 'invites',
  })

  const createInvite = useMutation({
    mutationFn: () =>
      invitesApi.create({
        email: officerForm.email.trim(),
        firstName: officerForm.firstName.trim(),
        lastName: officerForm.lastName.trim(),
        phone: officerForm.phone.trim() || undefined,
        inviteType: 'PROTOCOL',
        assignedProtocolRoleId: officerForm.assignedProtocolRoleId,
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
        assignedProtocolRoleId: officerForm.assignedProtocolRoleId,
      })
      qc.invalidateQueries({ queryKey: ['account-invites'] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Could not create invite')
    },
  })

  const provisionMember = useMutation({
    mutationFn: () =>
      protocolApi.provisionMember({
        email: memberForm.email.trim(),
        firstName: memberForm.firstName.trim(),
        lastName: memberForm.lastName.trim(),
        phone: memberForm.phone.trim() || undefined,
      }),
    onSuccess: (result) => {
      toast.success(
        result.existingAccount
          ? 'Existing account added to protocol'
          : 'Member account created',
      )
      if (result.temporaryPassword) {
        setCredentials({
          email: result.email,
          temporaryPassword: result.temporaryPassword,
          message: result.message,
          delivery: result.delivery,
        })
      } else {
        toast.info(result.message)
      }
      setMemberForm({ email: '', firstName: '', lastName: '', phone: '' })
      qc.invalidateQueries({ queryKey: ['protocol-members'] })
      qc.invalidateQueries({ queryKey: ['protocol-admin-dashboard'] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Could not create account')
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

  const tabs: { id: Tab; label: string; icon: typeof UserPlus }[] = [
    { id: 'officer', label: 'Invite officer', icon: Link2 },
    { id: 'member', label: 'Add regular member', icon: Users },
    { id: 'invites', label: 'Pending invites', icon: KeyRound },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl text-text-primary">Member onboarding</h2>
        <p className="text-text-secondary text-sm mt-1">
          Internal accounts only — invite officers with a role or create regular member credentials.
        </p>
      </div>

      <Card padding="md" accent="info">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">No self-service claims.</strong> Members cannot
          request protocol access from the portal. To add an existing church member who already has
          an account, use{' '}
          <a href="/protocol/invitations" className="text-primary-600 font-semibold">
            Invitations
          </a>{' '}
          instead.
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
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!officerForm.assignedProtocolRoleId) {
                toast.error('Select a protocol position')
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
                onChange={(e) => setOfficerForm((s) => ({ ...s, firstName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
              />
              <input
                type="text"
                required
                placeholder="Last name"
                value={officerForm.lastName}
                onChange={(e) => setOfficerForm((s) => ({ ...s, lastName: e.target.value }))}
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
              placeholder="Phone (optional — for SMS/WhatsApp)"
              value={officerForm.phone}
              onChange={(e) => setOfficerForm((s) => ({ ...s, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
            <select
              required
              value={officerForm.assignedProtocolRoleId}
              onChange={(e) =>
                setOfficerForm((s) => ({ ...s, assignedProtocolRoleId: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            >
              <option value="">Select protocol position…</option>
              {officerRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {roleLabel(role.name)}
                </option>
              ))}
            </select>
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
                    className="px-3 py-2 rounded-lg border border-border"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  Invite delivery was attempted via email/SMS/WhatsApp when configured.
                </p>
              )}
              {lastInvite.whatsappMessage && (
                <button
                  type="button"
                  onClick={() => copyText(lastInvite.whatsappMessage!, 'Message')}
                  className="text-xs font-semibold text-primary-600"
                >
                  Copy message text
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      {tab === 'member' && (
        <Card padding="md">
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
                onChange={(e) => setMemberForm((s) => ({ ...s, firstName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
              />
              <input
                type="text"
                required
                placeholder="Last name"
                value={memberForm.lastName}
                onChange={(e) => setMemberForm((s) => ({ ...s, lastName: e.target.value }))}
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
              {credentials.delivery && (
                <p className="text-xs text-text-muted">
                  Delivery: email {credentials.delivery.email}, WhatsApp{' '}
                  {credentials.delivery.whatsapp}, SMS {credentials.delivery.sms}
                </p>
              )}
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
                  >
                    <Copy size={14} />
                  </button>
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'invites' && (
        <div className="space-y-3">
          {(pendingInvites?.items ?? []).length === 0 ? (
            <Card padding="md">
              <p className="text-center text-text-muted py-8 text-sm">No pending officer invites.</p>
            </Card>
          ) : (
            pendingInvites?.items.map((inv) => (
              <Card key={inv.id} padding="md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-text-primary">
                      {inv.firstName} {inv.lastName}
                    </p>
                    <p className="text-sm text-text-secondary">{inv.email}</p>
                    {inv.assignedProtocolRole && (
                      <Badge variant="default" className="mt-2">
                        {roleLabel(inv.assignedProtocolRole.name)}
                      </Badge>
                    )}
                    <p className="text-xs text-text-muted mt-1">
                      Expires {formatDate(inv.expiresAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
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
