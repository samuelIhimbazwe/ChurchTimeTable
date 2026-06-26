'use client'

import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores'
import { membersApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import {
  Card, Avatar, Badge, StatTile, SkeletonStatTile, SkeletonCard,
} from '@/components/shared'
import { FormField, Input } from '@/components/shared/form'
import { profileFormSchema, type ProfileFormValues } from '@/lib/validation/schemas'
import { formatDate, scoreBandLabel } from '@/lib/utils/format'
import type { MinistryScope, ScoreBand } from '@/types'
import { Camera, Save, Users, Building2, CheckCircle2, Star } from 'lucide-react'

const MINISTRY_BADGE: Record<MinistryScope, 'ministry-choir' | 'ministry-protocol' | 'ministry-both' | 'role-member'> = {
  CHOIR:    'ministry-choir',
  PROTOCOL: 'ministry-protocol',
  BOTH:     'ministry-both',
  NONE:     'role-member',
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: '',
    },
  })

  const { data: profileCenter, isLoading } = useQuery({
    queryKey: ['profile-center', user?.id],
    queryFn:  () => membersApi.getProfileCenter(user!.id),
    enabled:  !!user?.id,
  })

  const save = useMutation({
    mutationFn: (data: ProfileFormValues) => membersApi.updateProfile(user!.id, data),
    onSuccess:  () => toast.success('Profile updated'),
    onError:    () => toast.error('Update failed'),
  })

  const member     = profileCenter?.member as Record<string, unknown> | undefined
  const family     = profileCenter?.family as Record<string, unknown> | null | undefined
  const leadership = profileCenter?.leadership as Record<string, unknown> | undefined
  const dashboard  = profileCenter?.dashboard as Record<string, unknown> | undefined
  const attendanceScore = dashboard?.attendanceScore as Record<string, unknown> | undefined
  const ministry = member?.ministry as MinistryScope | undefined

  const familyRoles = (leadership?.familyRoles ?? []) as Array<Record<string, unknown>>
  const choirRoles  = (leadership?.choirCommitteeRoles ?? []) as Array<Record<string, unknown>>

  useEffect(() => {
    if (!profileCenter) return
    const m = profileCenter.member as Record<string, unknown> | undefined
    form.reset({
      name: String(m?.fullName ?? user?.name ?? ''),
      email: String(m?.email ?? user?.email ?? ''),
      phone: String(m?.phone ?? ''),
    })
  }, [profileCenter, user?.name, user?.email, form])

  const { errors } = form.formState

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="font-display page-heading text-text-primary">My Profile</h2>

      {/* Avatar + summary */}
      <Card padding="md">
        <div className="flex flex-col xs:flex-row items-center xs:items-start gap-4 sm:gap-6 pb-6 mb-6 border-b border-border text-center xs:text-left">
          <div className="relative">
            <Avatar name={user?.name ?? 'U'} size="xl" />
            <button
              aria-label="Change photo"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary-700 text-white flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors"
            >
              <Camera size={13} />
            </button>
          </div>
          <div>
            <p className="font-display text-2xl text-text-primary">{user?.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="role-member">{user?.role?.replace(/_/g, ' ')}</Badge>
              {ministry && ministry !== 'NONE' && (
                <Badge variant={MINISTRY_BADGE[ministry]}>{ministry}</Badge>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1">{user?.email}</p>
            {member?.memberNumber != null && (
              <p className="text-xs text-text-muted">#{String(member.memberNumber)}</p>
            )}
          </div>
        </div>

        {/* Participation score */}
        {isLoading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 mb-6">
            <SkeletonStatTile />
            <SkeletonStatTile />
          </div>
        ) : attendanceScore && (
          <div className="mb-6 pb-6 border-b border-border space-y-4">
            <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Star size={15} className="text-gold-600" /> Participation Score
            </p>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              <StatTile
                label="Score"
                value={Math.round(Number(attendanceScore.weightedPoints ?? attendanceScore.score ?? 0))}
                suffix=" pts"
                icon={Star}
                animate={false}
              />
              <StatTile
                label="Attendance"
                value={Math.round(Number(attendanceScore.percentage ?? 0))}
                suffix="%"
                icon={CheckCircle2}
                animate={false}
              />
            </div>
            {attendanceScore.band != null && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Standing:</span>
                <Badge
                  variant={
                    attendanceScore.band === 'excellent' ? 'status-present' :
                    attendanceScore.band === 'good'      ? 'status-excused' :
                                                           'status-absent'
                  }
                  dot
                >
                  {scoreBandLabel(String(attendanceScore.band) as ScoreBand)}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Family info */}
        {isLoading ? (
          <SkeletonCard rows={2} />
        ) : family ? (
          <div className="mb-6 pb-6 border-b border-border">
            <p className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
              <Users size={15} className="text-primary-600" /> Family
            </p>
            <div className="rounded-lg bg-surface-raised p-4 space-y-1">
              <p className="text-sm font-medium text-text-primary">
                {String(family.familyName ?? 'Family')}
              </p>
              {family.familyCode != null && (
                <p className="text-xs text-text-muted">Code: {String(family.familyCode)}</p>
              )}
              {family.role != null && (
                <Badge variant="default" className="mt-2">
                  {String(family.role).replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          </div>
        ) : null}

        {/* Ministry memberships / leadership */}
        {isLoading ? (
          <SkeletonCard rows={2} />
        ) : (familyRoles.length > 0 || choirRoles.length > 0 || (ministry && ministry !== 'NONE')) ? (
          <div className="mb-6 pb-6 border-b border-border">
            <p className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
              <Building2 size={15} className="text-primary-600" /> Ministry &amp; Roles
            </p>
            <div className="space-y-2">
              {ministry && ministry !== 'NONE' && (
                <div className="flex items-center justify-between text-sm py-2 border-b border-border">
                  <span className="text-text-secondary">Primary ministry</span>
                  <Badge variant={MINISTRY_BADGE[ministry]}>{ministry}</Badge>
                </div>
              )}
              {familyRoles.map((role) => (
                <div
                  key={String(role.familyId)}
                  className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                >
                  <span className="text-text-primary">
                    {String(role.familyName ?? 'Family')} — {String(role.role ?? '').replace(/_/g, ' ')}
                  </span>
                  {role.since != null && (
                    <span className="text-xs text-text-muted">since {formatDate(String(role.since))}</span>
                  )}
                </div>
              ))}
              {choirRoles.map((role, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                >
                  <span className="text-text-primary">
                    Choir committee — {String(role.roleName ?? '')}
                  </span>
                  {role.assignedAt != null && (
                    <span className="text-xs text-text-muted">
                      since {formatDate(String(role.assignedAt))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Attendance summary from dashboard */}
        {!isLoading && dashboard && (
          <div className="mb-6 pb-6 border-b border-border">
            <p className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
              <CheckCircle2 size={15} className="text-success" /> Attendance Summary
            </p>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-surface-raised p-3">
                <p className="text-xs text-text-muted">Rate</p>
                <p className="font-semibold text-text-primary">
                  {Math.round(Number(attendanceScore?.percentage ?? 0))}%
                </p>
              </div>
              <div className="rounded-lg bg-surface-raised p-3">
                <p className="text-xs text-text-muted">Upcoming assignments</p>
                <p className="font-semibold text-text-primary">
                  {((dashboard.upcomingAssignments as unknown[]) ?? []).length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Edit form */}
        <form
          onSubmit={form.handleSubmit((data) => save.mutate(data))}
          className="space-y-4"
        >
          <FormField label="Full name" required error={errors.name?.message}>
            <Input
              type="text"
              {...form.register('name')}
              error={!!errors.name}
            />
          </FormField>
          <FormField label="Email address" required error={errors.email?.message}>
            <Input
              type="email"
              {...form.register('email')}
              error={!!errors.email}
            />
          </FormField>
          <FormField label="Phone number" error={errors.phone?.message}>
            <Input type="tel" {...form.register('phone')} />
          </FormField>

          <div className="flex flex-col-reverse xs:flex-row xs:justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="flex items-center justify-center gap-2 w-full xs:w-auto px-5 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-60 min-h-[2.75rem]"
            >
              <Save size={15} />
              {save.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
