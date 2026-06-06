'use client'

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/shared'
import { Server, UserCog } from 'lucide-react'

const NEEDED_FEATURES = [
  'List all system users with search and pagination',
  'Create new user accounts and link to member profiles',
  'Assign and revoke roles per user',
  'Reset passwords and manage account lockout',
  'View user login history and last active timestamp',
  'Bulk import users from CSV',
  'Deactivate or archive user accounts',
  'Audit trail for user permission changes',
]

export default function SystemUsersPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">User Management</h2>
        <p className="text-text-secondary text-sm mt-1">Platform user administration</p>
      </div>

      <Card accent="warning" padding="md">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
            <Server size={22} className="text-warning" />
          </div>
          <div>
            <p className="font-display text-lg text-text-primary">
              Backend required: Admin User Management API not yet available
            </p>
            <p className="text-sm text-text-secondary mt-2">
              This page is a placeholder. User management requires backend endpoints
              for listing, creating, and managing system accounts. No data is shown below.
            </p>
          </div>
        </div>
      </Card>

      <Card padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog size={18} /> Required API Features
          </CardTitle>
          <CardDescription>
            Capabilities needed before this page can be implemented
          </CardDescription>
        </CardHeader>
        <ul className="space-y-2">
          {NEEDED_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="text-primary-500 mt-0.5">•</span>
              {feature}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
