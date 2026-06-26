'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/api'
import { ApiError, ValidationError } from '@/lib/api'
import { useTranslations } from '@/lib/i18n'

export default function ForgotPasswordPage() {
  const { auth: t } = useTranslations()
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!email.trim()) {
      setFormError(t.requiredFields)
      return
    }

    setLoading(true)
    try {
      const result = await authApi.forgotPassword(email.trim())
      setDevResetUrl(result.devResetUrl ?? null)
      setSubmitted(true)
    } catch (err) {
      if (err instanceof ValidationError) {
        setFormError(err.message)
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
    'w-full pl-9 pr-4 py-2.5 rounded-lg text-sm',
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
          <h1 className="font-display text-3xl text-text-primary">{t.forgotPasswordTitle}</h1>
          <p className="text-text-secondary text-sm">{t.forgotPasswordSubtitle}</p>
        </div>

        {formError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-danger-light border border-danger/20 text-danger text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4">
            <div className="px-4 py-3 rounded-lg bg-success-light border border-success/20 text-sm text-text-primary">
              {t.forgotPasswordSuccess}
            </div>
            {devResetUrl && (
              <div className="px-4 py-3 rounded-lg bg-surface border border-border text-sm space-y-2">
                <p className="text-text-muted">{t.forgotPasswordDevHint}</p>
                <a
                  href={devResetUrl}
                  className="break-all font-medium text-primary-600 hover:underline"
                >
                  {devResetUrl}
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                {t.loginEmailLabel}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'py-2.5 px-4 rounded-lg text-sm font-semibold',
                'bg-gold-500 text-primary-900',
                'hover:bg-gold-400 active:bg-gold-700',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {loading ? t.sendingResetLink : t.sendResetLink}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-text-muted">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:underline"
          >
            <ArrowLeft size={14} />
            {t.backToSignIn}
          </Link>
        </p>
      </div>
    </div>
  )
}
