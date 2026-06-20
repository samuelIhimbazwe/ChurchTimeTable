'use client'



import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useRouter } from 'next/navigation'

import Link from 'next/link'

import { choirActivityApi } from '@/lib/api'

import { useResolvedChoirScope } from '@/lib/hooks'

import { ChoirOpsShell } from '@/components/choir/ChoirOpsShell'

import {

  Badge,

  DataTable,

  DataTableFilterBar,

  DataTableFilterChip,

  DataTableSearch,

  DataTableToolbar,

  EmptyState,

  PermissionGate,

  SkeletonCard,

  type DataTableColumn,

} from '@/components/shared'

import { Calendar, Clock, MapPin } from 'lucide-react'

import { formatDate, formatTime } from '@/lib/utils/format'

import type { ChoirActivity, ChoirActivityType } from '@/types'



const TYPE_BADGE: Partial<Record<ChoirActivityType, 'role-choir-president' | 'ministry-choir' | 'ministry-protocol' | 'role-member' | 'role-admin' | 'status-excused'>> = {

  SERVICE:          'role-choir-president',

  REHEARSAL:        'ministry-choir',

  PRAYER:           'ministry-protocol',

  MEETING:          'role-member',

  CONCERT:          'role-admin',

  SPECIAL_REHEARSAL:'status-excused',

}



const TYPES = ['', 'SERVICE', 'REHEARSAL', 'PRAYER', 'MEETING', 'CONCERT'] as const



export default function ActivitiesPage() {

  const [type, setType] = useState<string>('')

  const [search, setSearch] = useState('')

  const router = useRouter()

  const { choirId, choirLink } = useResolvedChoirScope()



  const { data, isLoading } = useQuery({

    queryKey: ['choir-activities', choirId, { type: type || undefined }],

    queryFn:  () => choirActivityApi.getAll({

      choirId,

      limit: 100,

      activityType: type || undefined,

    }),

    enabled: !!choirId,

  })



  const items = useMemo(() => {

    const list = data?.items ?? []

    if (!search.trim()) return list

    const q = search.toLowerCase()

    return list.filter(

      (a) =>

        a.title.toLowerCase().includes(q) ||

        a.activityType.toLowerCase().includes(q) ||

        (a.location?.toLowerCase().includes(q) ?? false),

    )

  }, [data?.items, search])



  const columns = useMemo<DataTableColumn<ChoirActivity>[]>(

    () => [

      {

        id: 'type',

        header: 'Type',

        accessorFn: (a) => a.activityType,

        sortable: true,

        cell: ({ row: a }) => (

          <Badge variant={TYPE_BADGE[a.activityType] ?? 'default'}>

            {a.activityType.replace('_', ' ')}

          </Badge>

        ),

      },

      {

        id: 'title',

        header: 'Activity',

        accessorFn: (a) => a.title,

        sortable: true,

        sticky: true,

        cell: ({ row: a }) => (

          <div className="min-w-0">

            <p className="font-medium text-text-primary truncate">{a.title}</p>

            {!a.attendanceOpen && (

              <span className="text-xs text-text-muted">Attendance locked</span>

            )}

          </div>

        ),

      },

      {

        id: 'date',

        header: 'Date',

        accessorFn: (a) => a.date,

        sortable: true,

        cell: ({ row: a }) => (

          <span className="flex items-center gap-1 text-sm text-text-secondary">

            <Calendar size={12} className="shrink-0" />

            {formatDate(a.date)}

          </span>

        ),

      },

      {

        id: 'time',

        header: 'Time',

        accessorFn: (a) => a.startTime ?? '',

        sortable: true,

        cell: ({ row: a }) =>

          a.startTime ? (

            <span className="flex items-center gap-1 text-sm text-text-secondary">

              <Clock size={12} className="shrink-0" />

              {formatTime(a.startTime)}

            </span>

          ) : (

            <span className="text-text-muted">—</span>

          ),

      },

      {

        id: 'location',

        header: 'Location',

        accessorFn: (a) => a.location ?? '',

        cell: ({ row: a }) =>

          a.location ? (

            <span className="flex items-center gap-1 text-sm text-text-secondary truncate max-w-[160px]">

              <MapPin size={12} className="shrink-0" />

              {a.location}

            </span>

          ) : (

            <span className="text-text-muted">—</span>

          ),

      },

      {

        id: 'attendance',

        header: 'Marked',

        accessorFn: (a) => a.attendanceCount ?? 0,

        sortable: true,

        align: 'right',

        cell: ({ row: a }) =>

          a.attendanceCount != null && a.memberCount != null ? (

            <span className="font-medium text-text-secondary">

              {a.attendanceCount}/{a.memberCount}

            </span>

          ) : (

            <span className="text-text-muted">—</span>

          ),

      },

    ],

    [],

  )



  const total = items.length



  return (

    <ChoirOpsShell

      title="Activities"

      subtitle="Rehearsals, services, and meetings — open any row to mark attendance."

      meta={`${total} activit${total === 1 ? 'y' : 'ies'}`}

    >

      <div className="space-y-4">

        <div className="flex items-center justify-end">

          <PermissionGate anyOf={['choir.events.manage', 'event:write']}>

            <Link

              href={choirLink('activities/new')}

              className="px-4 py-2 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors"

            >

              + New Activity

            </Link>

          </PermissionGate>

        </div>



        {isLoading ? (

          <SkeletonCard rows={6} />

        ) : total === 0 && !type && !search ? (

          <EmptyState
            title="No activities"
            description="Create an activity or adjust filters to see more."
            actionHref={choirLink('activities/new')}
            actionLabel="Create activity"
          />

        ) : (

          <DataTable

            columns={columns}

            data={items}

            getRowId={(a) => a.id}

            pagination={{ pageSize: 25 }}

            onRowClick={(a) => router.push(choirLink('attendance', a.id))}

            toolbar={

              <DataTableToolbar>

                <DataTableSearch

                  value={search}

                  onChange={setSearch}

                  placeholder="Search activities…"

                />

                <DataTableFilterBar>

                  {TYPES.map((t) => (
                    <DataTableFilterChip
                      key={t || 'all'}
                      label={t ? t.replace('_', ' ') : 'All types'}
                      active={type === t}
                      onClick={() => setType(t)}
                    />
                  ))}

                </DataTableFilterBar>

              </DataTableToolbar>

            }

            mobileRow={(a) => (

              <div className="space-y-1">

                <div className="flex items-center gap-2 flex-wrap">

                  <Badge variant={TYPE_BADGE[a.activityType] ?? 'default'}>

                    {a.activityType}

                  </Badge>

                  {a.attendanceCount != null && a.memberCount != null && (

                    <span className="text-xs text-text-muted">

                      {a.attendanceCount}/{a.memberCount} marked

                    </span>

                  )}

                </div>

                <p className="font-semibold text-text-primary">{a.title}</p>

                <p className="text-xs text-text-muted">

                  {formatDate(a.date)}

                  {a.startTime ? ` · ${formatTime(a.startTime)}` : ''}

                  {a.location ? ` · ${a.location}` : ''}

                </p>

              </div>

            )}

          />

        )}

      </div>

    </ChoirOpsShell>

  )

}

