'use client'

import { Eye, Shield } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useViewAsStore } from '@/lib/governance/view-as-store'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export function ViewAsMemberBanner({ className }: Props) {
  const pathname = usePathname()
  const viewAsMember = useViewAsStore((s) => s.viewAsMember)
  const setViewAsMember = useViewAsStore((s) => s.setViewAsMember)

  if (!viewAsMember) return null

  const isAdminContext =
    pathname.startsWith('/choir/admin') ||
    pathname.startsWith('/protocol/admin')

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b text-sm font-medium',
        isAdminContext
          ? 'bg-danger-light border-danger/40 text-danger'
          : 'bg-warning-light border-warning/40 text-warning',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 min-w-0">
        {isAdminContext ? (
          <Shield size={16} className="shrink-0" />
        ) : (
          <Eye size={16} className="shrink-0" />
        )}
        <span>
          {isAdminContext ? (
            <>
              <strong>Admin preview mode</strong> — member-level permissions are enforced.
              Admin actions may be hidden until you exit preview.
            </>
          ) : (
            <>
              <strong>Member preview</strong> — you are viewing the app with member-level access only.
            </>
          )}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setViewAsMember(false)}
        className={cn(
          'shrink-0 px-3 py-1 text-xs font-bold rounded-lg text-white hover:opacity-90',
          isAdminContext ? 'bg-danger' : 'bg-warning',
        )}
      >
        Exit preview
      </button>
    </div>
  )
}
