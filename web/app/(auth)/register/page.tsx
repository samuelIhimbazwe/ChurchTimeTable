'use client'

import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

export default function RegisterPage() {
  const { auth: t } = useTranslations()

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-raised">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="flex items-center gap-3 justify-center">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-900">
            <span className="font-display font-bold text-gold-500 text-base">C</span>
          </div>
          <span className="font-display font-semibold text-xl text-text-primary">CMMS</span>
        </div>

        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            <Mail size={22} />
          </div>
          <h1 className="font-display text-2xl text-text-primary">{t.registerInviteOnlyTitle}</h1>
          <p className="text-sm text-text-secondary leading-relaxed">{t.registerInviteOnlyBody}</p>
        </div>

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
