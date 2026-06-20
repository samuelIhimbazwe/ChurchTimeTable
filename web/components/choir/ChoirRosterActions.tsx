'use client'

import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { choirApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { useContextConfirm } from '@/components/governance/useContextConfirm'
import { choirPositionLabel } from '@/lib/constants/choir-positions'
import type { ChoirMember } from '@/types'

type Props = {
  member: ChoirMember
  choirId: string
}

export function ChoirRosterActions({ member, choirId }: Props) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [assignRoleId, setAssignRoleId] = useState('')
  const { confirm, dialog } = useContextConfirm()
  const pendingDeactivate = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: roles } = useQuery({
    queryKey: ['choir-position-roles', choirId],
    queryFn: () => choirApi.getPositionRoles(choirId),
    enabled: open,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['choir-members'] })
  }

  const assign = useMutation({
    mutationFn: () =>
      choirApi.assignMemberPosition({
        choirId,
        memberId: member.memberId,
        roleId: assignRoleId,
      }),
    onSuccess: () => {
      toast.success('Position assigned')
      setAssignRoleId('')
      setOpen(false)
      invalidate()
    },
    onError: () => toast.error('Could not assign position'),
  })

  const revoke = useMutation({
    mutationFn: (roleId: string) =>
      choirApi.revokeMemberPosition({
        choirId,
        memberId: member.memberId,
        roleId,
      }),
    onSuccess: () => {
      toast.success('Position removed')
      invalidate()
    },
    onError: () => toast.error('Could not remove position'),
  })

  const deactivate = useMutation({
    mutationFn: () =>
      choirApi.deactivateMember({ choirId, memberId: member.memberId }),
    onSuccess: (data) => {
      toast.success(`${data.memberName} removed from choir roster`)
      setOpen(false)
      invalidate()
    },
    onError: () => toast.error('Could not deactivate membership'),
  })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-primary-600 hover:text-primary-800 px-2 py-1"
        aria-label={`Actions for ${member.name}`}
      >
        ···
      </button>
    )
  }

  return (
    <>
      {dialog}
    <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-border bg-surface shadow-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-primary truncate">{member.name}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-text-muted"
        >
          Close
        </button>
      </div>

      {member.positions && member.positions.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-1">Current positions</p>
          <ul className="space-y-1">
            {member.positions.map((p) => (
              <li key={p.roleId} className="flex items-center justify-between gap-2 text-xs">
                <span>{choirPositionLabel(p.roleName)}</span>
                <button
                  type="button"
                  onClick={() => revoke.mutate(p.roleId)}
                  disabled={revoke.isPending}
                  className="text-danger font-semibold"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-text-secondary">Assign position</label>
        <select
          value={assignRoleId}
          onChange={(e) => setAssignRoleId(e.target.value)}
          className="mt-1 w-full px-2 py-1.5 rounded-lg text-xs bg-surface border border-border"
        >
          <option value="">Select role…</option>
          {(roles ?? []).map((r) => (
            <option key={r.id} value={r.id}>
              {choirPositionLabel(r.name)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => assign.mutate()}
          disabled={!assignRoleId || assign.isPending}
          className="mt-2 w-full px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
        >
          {assign.isPending ? 'Assigning…' : 'Assign'}
        </button>
      </div>

      <Link
        href={`/members?search=${encodeURIComponent(member.name)}`}
        className="block text-xs font-semibold text-primary-600 hover:text-primary-800"
        onClick={() => setOpen(false)}
      >
        View in church directory →
      </Link>

      <button
        type="button"
        onClick={async () => {
          const ok = await confirm({
            title: 'Remove from choir?',
            description: (
              <>
                Remove <strong className="text-text-primary">{member.name}</strong> from this
                choir? Committee seats will end today.
              </>
            ),
            confirmLabel: 'Remove member',
            variant: 'danger',
          })
          if (!ok) return

          if (pendingDeactivate.current) clearTimeout(pendingDeactivate.current)

          toast.withUndo(
            `Removing ${member.name}…`,
            {
              label: 'Undo',
              onClick: () => {
                if (pendingDeactivate.current) {
                  clearTimeout(pendingDeactivate.current)
                  pendingDeactivate.current = null
                }
              },
            },
            'You have 5 seconds to undo',
          )

          pendingDeactivate.current = setTimeout(() => {
            pendingDeactivate.current = null
            deactivate.mutate()
          }, 5000)
        }}
        disabled={deactivate.isPending}
        className="w-full mt-2 px-3 py-1.5 text-xs font-semibold text-danger border border-danger/30 rounded-lg hover:bg-danger/5 disabled:opacity-60"
      >
        {deactivate.isPending ? 'Removing…' : 'Remove from choir'}
      </button>
    </div>
    </>
  )
}
