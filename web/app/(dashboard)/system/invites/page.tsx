'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, MailPlus, RefreshCw, UserPlus, XCircle } from 'lucide-react'
import { choirApi, invitesApi } from '@/lib/api'
import type { AccountInviteType } from '@/lib/api'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared'

const INVITE_TYPES: AccountInviteType[] = ['CHOIR', 'PROTOCOL', 'DUAL']

export default function SystemInvitesPage() {
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [inviteType, setInviteType] = useState<AccountInviteType>('CHOIR')
  const [choirId, setChoirId] = useState('')
  const [lastCreated, setLastCreated] = useState<{
    inviteUrl?: string
    whatsappMessage?: string
  } | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: choirs = [] } = useQuery({
    queryKey: ['choirs'],
    queryFn: choirApi.list,
  })

  const { data: invites, isLoading, refetch } = useQuery({
    queryKey: ['invites'],
    queryFn: () => invitesApi.list({ limit: 50 }),
  })

  const needsChoir = inviteType === 'CHOIR' || inviteType === 'DUAL'

  const createMutation = useMutation({
    mutationFn: invitesApi.create,
    onSuccess: (invite) => {
      setLastCreated({
        inviteUrl: invite.inviteUrl,
        whatsappMessage: invite.whatsappMessage,
      })
      setEmail('')
      setFirstName('')
      setLastName('')
      setPhone('')
      qc.invalidateQueries({ queryKey: ['invites'] })
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const revokeMutation = useMutation({
    mutationFn: invitesApi.revoke,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invites'] }),
  })

  const resendMutation = useMutation({
    mutationFn: invitesApi.resend,
    onSuccess: (invite) => {
      setLastCreated({
        inviteUrl: invite.inviteUrl,
        whatsappMessage: invite.whatsappMessage,
      })
      qc.invalidateQueries({ queryKey: ['invites'] })
    },
  })

  const pendingItems = useMemo(
    () => invites?.items.filter((i) => i.status === 'PENDING') ?? [],
    [invites],
  )

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setFormError('Email, first name, and last name are required.')
      return
    }
    if (needsChoir && !choirId) {
      setFormError('Select a choir for this invite.')
      return
    }
    createMutation.mutate({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      inviteType,
      choirId: needsChoir ? choirId : undefined,
    })
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">Member invites</h2>
          <p className="text-text-secondary text-sm mt-1">
            Send one-time invite links by email. Copy the link for WhatsApp manually.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-raised text-text-secondary"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus size={18} />
            New invite
          </CardTitle>
          <CardDescription>
            Email is required. The member sets their password when accepting the invite.
          </CardDescription>
        </CardHeader>

        {formError && (
          <p className="mb-4 text-sm text-danger">{formError}</p>
        )}

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-text-primary">First name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-text-primary">Last name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-text-primary">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-text-primary">Phone (optional)</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-text-primary">Invite type</span>
            <select
              value={inviteType}
              onChange={(e) => setInviteType(e.target.value as AccountInviteType)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
            >
              {INVITE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          {needsChoir && (
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-text-primary">Choir</span>
              <select
                value={choirId}
                onChange={(e) => setChoirId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              >
                <option value="">Select choir…</option>
                {choirs.map((choir) => (
                  <option key={choir.id} value={choir.id}>
                    {choir.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-primary-900 text-sm font-semibold hover:bg-gold-400 disabled:opacity-60"
            >
              <MailPlus size={16} />
              {createMutation.isPending ? 'Sending…' : 'Create invite'}
            </button>
          </div>
        </form>

        {lastCreated?.inviteUrl && (
          <div className="mt-6 p-4 rounded-lg bg-surface-raised border border-border space-y-3">
            <p className="text-sm font-medium text-text-primary">Invite link (dev / copy)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs break-all text-text-secondary">
                {lastCreated.inviteUrl}
              </code>
              <button
                type="button"
                onClick={() => copyText(lastCreated.inviteUrl!)}
                className="p-2 rounded-lg border border-border hover:bg-surface"
                aria-label="Copy invite link"
              >
                <Copy size={14} />
              </button>
            </div>
            {lastCreated.whatsappMessage && (
              <>
                <p className="text-sm font-medium text-text-primary">WhatsApp message</p>
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-xs text-text-secondary whitespace-pre-wrap">
                    {lastCreated.whatsappMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyText(lastCreated.whatsappMessage!)}
                    className="p-2 rounded-lg border border-border hover:bg-surface shrink-0"
                    aria-label="Copy WhatsApp message"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Recent invites</CardTitle>
          <CardDescription>
            Pending invites expire after 7 days.
          </CardDescription>
        </CardHeader>

        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : pendingItems.length === 0 ? (
          <p className="text-sm text-text-muted">No pending invites.</p>
        ) : (
          <div className="space-y-2">
            {pendingItems.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {invite.firstName} {invite.lastName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {invite.email} · {invite.inviteType}
                    {invite.choir ? ` · ${invite.choir.name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => resendMutation.mutate(invite.id)}
                    disabled={resendMutation.isPending}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-raised"
                  >
                    Resend
                  </button>
                  <button
                    type="button"
                    onClick={() => revokeMutation.mutate(invite.id)}
                    disabled={revokeMutation.isPending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-danger/30 text-danger hover:bg-danger-light"
                  >
                    <XCircle size={12} />
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
