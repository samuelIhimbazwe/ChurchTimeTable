'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertCircle, Lock, Mail, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRegister } from '@/lib/hooks'
import { ApiError, ConflictError, ValidationError } from '@/lib/api'
import {
  CHURCH_RELATIONSHIP_OPTIONS,
  SIGNUP_INTEREST_OPTIONS,
} from '@/lib/auth/signup'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [churchRelationship, setChurchRelationship] = useState('NEW_TO_CHURCH')
  const [interests, setInterests] = useState<string[]>([])
  const [relationshipNotes, setRelationshipNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { mutate: register, isPending } = useRegister()

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      setFormError('Please complete all required fields.')
      return
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    register(
      {
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        churchRelationship,
        interests: interests.length ? interests : undefined,
        relationshipNotes: relationshipNotes.trim() || undefined,
      },
      {
        onError: (err) => {
          if (err instanceof ConflictError) {
            setFormError('This email is already registered. Try signing in instead.')
          } else if (err instanceof ValidationError) {
            setFormError(err.message)
          } else if (err instanceof ApiError && err.status === 0) {
            setFormError('Unable to reach the server. Please try again later.')
          } else if (err instanceof ApiError) {
            setFormError(err.message)
          } else {
            setFormError('Registration failed. Please try again.')
          }
        },
      },
    )
  }

  const inputClass = cn(
    'w-full px-3 py-2.5 rounded-lg text-sm',
    'bg-surface border border-border',
    'text-text-primary placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  )

  return (
    <div className="min-h-screen flex bg-surface-raised">
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-[480px] space-y-6 py-8">
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-900">
              <span className="font-display font-bold text-gold-500 text-base">C</span>
            </div>
            <span className="font-display font-semibold text-xl text-text-primary">CMMS</span>
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-3xl text-text-primary">Create your account</h1>
            <p className="text-text-secondary text-sm">
              Register for church membership. A leader will approve your access to ministries.
            </p>
          </div>

          {formError && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-danger-light border border-danger/20 text-danger text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="block text-sm font-medium text-text-primary">
                  First name *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={cn(inputClass, 'pl-9')}
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="block text-sm font-medium text-text-primary">
                  Last name *
                </label>
                <input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                Email *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn(inputClass, 'pl-9')}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-sm font-medium text-text-primary">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                className={inputClass}
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                  Password *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(inputClass, 'pl-9')}
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary">
                  Confirm password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="churchRelationship" className="block text-sm font-medium text-text-primary">
                Your connection to the church
              </label>
              <select
                id="churchRelationship"
                value={churchRelationship}
                onChange={(e) => setChurchRelationship(e.target.value)}
                className={inputClass}
                disabled={isPending}
              >
                {CHURCH_RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">Ministries you are interested in</p>
              <div className="flex flex-wrap gap-2">
                {SIGNUP_INTEREST_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border cursor-pointer',
                      interests.includes(opt.id)
                        ? 'bg-primary-100 border-primary-400 text-primary-800'
                        : 'border-border text-text-secondary',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={interests.includes(opt.id)}
                      onChange={() => toggleInterest(opt.id)}
                      disabled={isPending}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="notes" className="block text-sm font-medium text-text-primary">
                Anything else we should know?
              </label>
              <textarea
                id="notes"
                value={relationshipNotes}
                onChange={(e) => setRelationshipNotes(e.target.value)}
                rows={2}
                placeholder="Optional"
                className={inputClass}
                disabled={isPending}
              />
            </div>

            <p className="text-xs text-text-muted">
              After you register, church leaders will review your account before full ministry access is granted.
            </p>

            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'w-full py-2.5 px-4 rounded-lg text-sm font-semibold',
                'bg-gold-500 text-primary-900 hover:bg-gold-400',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {isPending ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
