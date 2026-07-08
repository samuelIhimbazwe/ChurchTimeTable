'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/stores'
import { SheetModal } from '@/components/shared/SheetModal'
import { toast } from '@/components/shared/Toast'
import { Lock } from 'lucide-react'

export function MustChangePasswordGate() {
  const user = useAuthStore((s) => s.user)
  const setMustChangePassword = useAuthStore((s) => s.setMustChangePassword)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const change = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        currentPassword,
        newPassword,
      }),
    onSuccess: () => {
      toast.success('Password updated')
      setMustChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Could not change password'
      toast.error(msg)
    },
  })

  if (!user?.mustChangePassword) return null

  const canSubmit =
    currentPassword.length >= 1
    && newPassword.length >= 6
    && newPassword === confirmPassword

  return (
    <SheetModal
      open
      onClose={() => {}}
      title="Change your password"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 text-sm text-text-secondary">
          <Lock size={18} className="shrink-0 mt-0.5 text-primary-600" />
          <p>
            Your account was created by a choir administrator. Set a new password
            before continuing.
          </p>
        </div>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSubmit) return
            change.mutate()
          }}
        >
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Temporary password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="New password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-danger">Passwords do not match</p>
          )}
          <button
            type="submit"
            disabled={!canSubmit || change.isPending}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary-700 text-white disabled:opacity-60"
          >
            {change.isPending ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </SheetModal>
  )
}
