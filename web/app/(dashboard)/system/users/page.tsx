'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Badge,
  Card,
  EmptyState,
  SkeletonCard,
  toast,
} from '@/components/shared'
import { PermissionGate } from '@/components/shared'
import {
  systemUsersApi,
  type CreateSystemUserPayload,
  type SystemUser,
} from '@/lib/api'
import { Search, UserPlus, KeyRound, UserX, UserCheck } from 'lucide-react'

export default function SystemUsersPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [resetUser, setResetUser] = useState<SystemUser | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['system-users', search, page],
    queryFn: () => systemUsersApi.list({ q: search || undefined, page, limit: 20 }),
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['system-user-roles'],
    queryFn: () => systemUsersApi.listRoles(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateSystemUserPayload) => systemUsersApi.create(payload),
    onSuccess: () => {
      toast.success('User created')
      setShowCreate(false)
      qc.invalidateQueries({ queryKey: ['system-users'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Create failed'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      systemUsersApi.update(id, { isActive }),
    onSuccess: () => {
      toast.success('User updated')
      qc.invalidateQueries({ queryKey: ['system-users'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Update failed'),
  })

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      systemUsersApi.resetPassword(id, password),
    onSuccess: () => {
      toast.success('Password reset')
      setResetUser(null)
      setNewPassword('')
    },
    onError: (err: Error) => toast.error(err.message || 'Reset failed'),
  })

  const users = data?.items ?? []

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-text-primary">User Management</h2>
          <p className="text-text-secondary text-sm mt-1">
            Create accounts, assign roles, reset passwords
          </p>
        </div>
        <PermissionGate permission="admin.users.manage">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-primary-900 text-sm font-semibold hover:bg-gold-400"
          >
            <UserPlus size={16} /> New user
          </button>
        </PermissionGate>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setSearch(q.trim())
        }}
      >
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email, name, member #"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface-raised"
        >
          Search
        </button>
      </form>

      <Card padding="none">
        {isLoading ? (
          <div className="p-5"><SkeletonCard rows={8} /></div>
        ) : users.length === 0 ? (
          <EmptyState icon={UserPlus} title="No users found" description="Try a different search or create a user." />
        ) : (
          <ul className="divide-y divide-border">
            {users.map((user) => (
              <li key={user.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-text-primary">{user.email}</p>
                    <Badge variant={user.isActive ? 'status-present' : 'status-inactive'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {user.member && (
                    <p className="text-sm text-text-secondary mt-0.5">
                      {user.member.firstName} {user.member.lastName}
                      {user.member.memberNumber ? ` · ${user.member.memberNumber}` : ''}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user.roles.map((r) => (
                      <Badge key={r.id} variant="default">{r.name}</Badge>
                    ))}
                  </div>
                </div>
                <PermissionGate permission="admin.users.manage">
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setResetUser(user)
                        setNewPassword('')
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-raised"
                    >
                      <KeyRound size={14} /> Reset password
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: user.id,
                          isActive: !user.isActive,
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-raised"
                    >
                      {user.isActive ? (
                        <><UserX size={14} /> Deactivate</>
                      ) : (
                        <><UserCheck size={14} /> Activate</>
                      )}
                    </button>
                  </div>
                </PermissionGate>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded border border-border disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-text-muted">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded border border-border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {showCreate && (
        <CreateUserModal
          roles={roles}
          loading={createMutation.isPending}
          onClose={() => setShowCreate(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
        />
      )}

      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card padding="md" className="w-full max-w-md">
            <h3 className="font-display text-lg">Reset password</h3>
            <p className="text-sm text-text-secondary mt-1">{resetUser.email}</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="mt-4 w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setResetUser(null)}
                className="px-3 py-2 text-sm rounded-lg border border-border"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={newPassword.length < 8 || resetMutation.isPending}
                onClick={() =>
                  resetMutation.mutate({ id: resetUser.id, password: newPassword })
                }
                className="px-3 py-2 text-sm rounded-lg bg-gold-500 text-primary-900 font-semibold disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function CreateUserModal({
  roles,
  loading,
  onClose,
  onSubmit,
}: {
  roles: { id: string; name: string }[]
  loading: boolean
  onClose: () => void
  onSubmit: (payload: CreateSystemUserPayload) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Pilot@123')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [ministry, setMinistry] = useState<'CHOIR' | 'PROTOCOL' | 'BOTH'>('BOTH')
  const [roleNames, setRoleNames] = useState<string[]>(['MEMBER'])

  function toggleRole(name: string) {
    setRoleNames((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name],
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <Card padding="md" className="w-full max-w-lg my-8">
        <h3 className="font-display text-lg">Create user</h3>
        <div className="mt-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="px-3 py-2 rounded-lg border border-border bg-surface text-sm"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="px-3 py-2 rounded-lg border border-border bg-surface text-sm"
            />
          </div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm"
          />
          <select
            value={ministry}
            onChange={(e) => setMinistry(e.target.value as typeof ministry)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm"
          >
            <option value="BOTH">Ministry: Both</option>
            <option value="CHOIR">Ministry: Choir</option>
            <option value="PROTOCOL">Ministry: Protocol</option>
          </select>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">Roles</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {roles.map((r) => (
                <label key={r.id} className="inline-flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={roleNames.includes(r.name)}
                    onChange={() => toggleRole(r.name)}
                  />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-lg border border-border">
            Cancel
          </button>
          <button
            type="button"
            disabled={
              loading ||
              !email.trim() ||
              password.length < 8 ||
              !firstName.trim() ||
              !lastName.trim() ||
              roleNames.length === 0
            }
            onClick={() =>
              onSubmit({
                email: email.trim(),
                password,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim() || undefined,
                ministry,
                roleNames,
              })
            }
            className="px-3 py-2 text-sm rounded-lg bg-gold-500 text-primary-900 font-semibold disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </Card>
    </div>
  )
}
