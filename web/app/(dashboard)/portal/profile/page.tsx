'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores'
import { membersApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Avatar, Badge } from '@/components/shared'
import { Camera, Save } from 'lucide-react'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const [form, setForm] = useState({
    name:  user?.name  ?? '',
    email: user?.email ?? '',
    phone: '',
  })

  const save = useMutation({
    mutationFn: () => membersApi.updateProfile(user!.id, form),
    onSuccess:  () => toast.success('Profile updated'),
    onError:    () => toast.error('Update failed'),
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="font-display text-3xl text-text-primary">My Profile</h2>

      <Card padding="md">
        {/* Avatar section */}
        <div className="flex items-center gap-6 pb-6 mb-6 border-b border-border">
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
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="role-member">{user?.role?.replace(/_/g, ' ')}</Badge>
            </div>
            <p className="text-xs text-text-muted mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate() }}
          className="space-y-4"
        >
          {[
            { label: 'Full name',     key: 'name',  type: 'text' },
            { label: 'Email address', key: 'email', type: 'email' },
            { label: 'Phone number',  key: 'phone', type: 'tel' },
          ].map(({ label, key, type }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-60"
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
