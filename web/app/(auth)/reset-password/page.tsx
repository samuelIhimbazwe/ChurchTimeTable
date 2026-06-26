'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/api'
import { ApiError, ValidationError } from '@/lib/api'
import { useTranslations } from '@/lib/i18n'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { auth: t } = useTranslations()

  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [formError, setFormError] = useState<string | null>(
    () => (token ? null : t.resetPasswordMissingToken),
  )
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!token) {
      setFormError(t.resetPasswordMissingToken)
      return
    }
    if (password.length < 6) {
      setFormError(t.passwordMin)
      return
    }
    if (password !== confirmPassword) {
      setFormError(t.passwordMismatch)
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword({ token, password })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      if (err instanceof ValidationError) {
        setFormError(err.message)
      } else if (err instanceof ApiError && err.status === 400) {
        setFormError(t.resetPasswordInvalid)
      } else if (err instanceof ApiError && err.status === 0) {
        setFormError(t.serverUnreachable)
      } else if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError(t.connectionError)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = cn(
    'w-full pl-9 pr-10 py-2.5 rounded-lg text-sm',
    'bg-surface border border-border',
    'text-text-primary placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-raised">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="flex items-center gap-3 justify-center">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-900">
            <span className="font-display font-bold text-gold-500 text-base">C</span>
          </div>
          <span className="font-display font-semibold text-xl text-text-primary">CMMS</span>
        </div>

        <div className="space-y-1">
          <h1 className="font-display text-3xl text-text-primary">{t.resetPasswordTitle}</h1>
          <p className="text-text-secondary text-sm">{t.resetPasswordSubtitle}</p>
        </div>

        {formError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-danger-light border border-danger/20 text-danger text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {success ? (
          <div className="px-4 py-3 rounded-lg bg-success-light border border-success/20 text-sm text-text-primary">
            {t.resetPasswordSuccess}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                {t.newPassword}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !token}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? t.hidePassword : t.showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary"
              >
                {t.confirmPassword}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  id="confirmPassword"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || !token}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'py-2.5 px-4 rounded-lg text-sm font-semibold',
                'bg-gold-500 text-primary-900',
                'hover:bg-gold-400 active:bg-gold-700',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {loading ? t.resettingPassword : t.resetPasswordAction}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-text-muted space-x-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:underline"
          >
            <ArrowLeft size={14} />
            {t.backToSignIn}
          </Link>
          {!token && (
            <Link href="/forgot-password" className="font-semibold text-primary-600 hover:underline">
              {t.forgotPassword}
            </Link>
          )}
        </p>
      </div>
    </div>
  )
}
