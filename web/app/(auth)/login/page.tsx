'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLogin } from '@/lib/hooks'
import { ApiError, AuthError, ValidationError } from '@/lib/api'
import { useTranslations, loginQuotes } from '@/lib/i18n'
import { useUIStore } from '@/stores'

export default function LoginPage() {
  const locale = useUIStore((s) => s.locale)
  const { auth: t, common: c } = useTranslations()

  const quote = useMemo(() => {
    const quotes = loginQuotes[locale]
    return quotes[new Date().getDay() % quotes.length]
  }, [locale])

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { mutate: login, isPending } = useLogin()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!email.trim() || !password) {
      setFormError(t.loginFieldsError)
      return
    }

    login(
      { email: email.trim(), password },
      {
        onError: (err) => {
          if (err instanceof AuthError) {
            setFormError(t.invalidCredentials)
          } else if (err instanceof ValidationError) {
            setFormError(err.message)
          } else if (err instanceof ApiError && err.status === 0) {
            setFormError(t.serverUnreachable)
          } else if (err instanceof ApiError && (err.status >= 500 || err.status === 502 || err.status === 503)) {
            setFormError(t.serverUnavailable)
          } else if (err instanceof ApiError) {
            setFormError(err.message)
          } else {
            setFormError(t.connectionError)
          }
        },
      },
    )
  }

  const loading = isPending

  return (
    <div className="min-h-screen flex">

      <div className="hidden lg:flex lg:w-[44%] relative flex-col justify-between p-12 overflow-hidden bg-primary-900">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full bg-primary-700 opacity-40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full bg-gold-700 opacity-20 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gold-500 shadow-overlay">
            <span className="font-display font-bold text-primary-900 text-lg">C</span>
          </div>
          <div>
            <p className="font-display font-semibold text-lg text-white leading-tight">CMMS</p>
            <p className="text-xs text-primary-300">{c.churchManagementSystem}</p>
          </div>
        </div>

        <div className="relative space-y-4">
          <div className="w-10 h-0.5 bg-gold-500" />
          <blockquote>
            <p className="font-display italic text-3xl text-white leading-snug">
              &ldquo;{quote.text}&rdquo;
            </p>
            <footer className="mt-4 text-primary-300 text-sm font-medium">
              &mdash; {quote.ref}
            </footer>
          </blockquote>
        </div>

        <div className="relative">
          <p className="text-primary-400 text-xs">
            &copy; {new Date().getFullYear()} {c.churchManagementSystem}.
            <br />{c.allRightsReserved}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-surface-raised">
        <div className="w-full max-w-[420px] space-y-8">

          <div className="flex lg:hidden items-center gap-3 justify-center">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-900">
              <span className="font-display font-bold text-gold-500 text-base">C</span>
            </div>
            <span className="font-display font-semibold text-xl text-text-primary">CMMS</span>
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-3xl text-text-primary">
              {t.signInTitle}
            </h1>
            <p className="text-text-secondary text-sm">
              {t.signInSubtitle}
            </p>
          </div>

          {formError && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-danger-light border border-danger/20 text-danger text-sm animate-page-enter">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary"
              >
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
                  onChange={(e) => { setEmail(e.target.value); setFormError(null) }}
                  placeholder={t.emailPlaceholder}
                  disabled={loading}
                  className={cn(
                    'w-full pl-9 pr-4 py-2.5 rounded-lg text-sm',
                    'bg-surface border border-border',
                    'text-text-primary placeholder:text-text-muted',
                    'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors duration-fast',
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary"
              >
                {t.loginPasswordLabel}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFormError(null) }}
                  placeholder="••••••••"
                  disabled={loading}
                  className={cn(
                    'w-full pl-9 pr-10 py-2.5 rounded-lg text-sm',
                    'bg-surface border border-border',
                    'text-text-primary placeholder:text-text-muted',
                    'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors duration-fast',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? t.hidePassword : t.showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary-600 focus:ring-gold-500"
                />
                <span className="text-sm text-text-secondary">{t.rememberMe}</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
              >
                {t.forgotPassword}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'py-2.5 px-4 rounded-lg text-sm font-semibold',
                'bg-gold-500 text-primary-900',
                'hover:bg-gold-400 active:bg-gold-700',
                'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'transition-all duration-fast shadow-card hover:shadow-raised',
              )}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-primary-900/30 border-t-primary-900 animate-spin" />
                  {t.signingIn}
                </>
              ) : (
                t.signIn
              )}
            </button>

          </form>

          <p className="text-center text-sm text-text-muted">
            {t.contactAdmin}
          </p>

        </div>
      </div>
    </div>
  )
}
