'use client'



import { useState } from 'react'

import type { ProtocolMonthlySchedulePrintGrid } from '@/lib/api/modules/protocol'

import type { ProtocolSchedulePlanEntry } from '@/lib/api/modules/protocol'

import { CapabilityGate } from '@/components/shared'

import { ProtocolScheduleCellEditor } from '@/components/protocol/scheduling/ProtocolScheduleCellEditor'

import { EditableBulletinText } from '@/components/protocol/scheduling/EditableBulletinText'
import { ChurchLogo } from '@/components/shared'
import { cn } from '@/lib/utils'

import {

  BULLETIN_COLUMNS,

  findWeekService,

  maxChoirRows,

  type BulletinService,

  type BulletinWeek,

} from '@/lib/protocol/schedule-bulletin'

import {

  resolveBulletinTitle,

  resolveCellText,

  resolveChurchName,

  resolveFooterLines,

  resolveIgaburoTitle,

  resolveServiceHeader,

  resolveWeekTitle,

  type ProtocolBulletinOverrides,

} from '@/lib/protocol/bulletin-overrides'



type ChoirOption = { id: string; name: string }



type EditProps = {

  planId: string

  entriesByOccurrence: Map<string, ProtocolSchedulePlanEntry[]>

  choirs: ChoirOption[]

  onChanged: () => void

}



type BulletinEditProps = EditProps & {

  onBulletinPatch: (patch: ProtocolBulletinOverrides) => void

}



type Props = {

  data: ProtocolMonthlySchedulePrintGrid

  editable?: boolean

  edit?: EditProps

  onBulletinPatch?: (patch: ProtocolBulletinOverrides) => void

  className?: string

  exportId?: string

}



export function ProtocolScheduleBulletinGrid({

  data,

  editable = false,

  edit,

  onBulletinPatch,

  className,

  exportId,

}: Props) {

  const overrides = data.bulletinOverrides ?? null

  const canEditAssignments = editable && Boolean(edit)

  const canEditText = canEditAssignments && Boolean(onBulletinPatch)



  const bulletinEdit: BulletinEditProps | undefined =

    edit && onBulletinPatch

      ? { ...edit, onBulletinPatch }

      : undefined



  return (

    <article

      {...(exportId ? { id: exportId } : {})}

      className={cn(

        'bg-white text-[#1a1a1a] rounded-xl border border-[#ccc] shadow-lg overflow-hidden',

        canEditText && 'ring-2 ring-gold-300/50',

        className,

      )}

    >

      <BulletinHeader

        title={resolveBulletinTitle(data, overrides)}

        churchName={resolveChurchName(overrides)}

        canEdit={canEditText}

        onSaveChurchName={(churchName) => onBulletinPatch?.({ churchName })}

        onSaveTitle={(title) => onBulletinPatch?.({ title })}

      />



      <div className="p-3 sm:p-4 space-y-4">

        {data.weeks.map((week) => (

          <WeekBlock

            key={week.weekIndex}

            week={week}

            overrides={overrides}

            canEditAssignments={canEditAssignments}

            canEditText={canEditText}

            edit={bulletinEdit}

          />

        ))}



        {data.igaburo.map((service) => (

          <IgaburoBlock

            key={service.occurrenceId}

            service={service}

            year={data.plan.year}

            overrides={overrides}

            canEditAssignments={canEditAssignments}

            canEditText={canEditText}

            edit={bulletinEdit}

          />

        ))}



        <footer className="pt-3 space-y-1 text-[10px] sm:text-xs text-[#444] border-t border-[#ddd]">

          {resolveFooterLines(data, overrides).map((line, index) => (

            <EditableBulletinText

              key={index}

              value={line}

              editable={canEditText}

              multiline

              className="block"

              onSave={(text) =>

                onBulletinPatch?.({

                  footerLines: resolveFooterLines(data, overrides).map((current, i) =>

                    i === index ? text : current,

                  ),

                })

              }

            />

          ))}

        </footer>

      </div>

    </article>

  )

}



function BulletinHeader({

  churchName,

  title,

  canEdit,

  onSaveChurchName,

  onSaveTitle,

}: {

  churchName: string

  title: string

  canEdit: boolean

  onSaveChurchName: (value: string) => void

  onSaveTitle: (value: string) => void

}) {

  return (
    <header className="text-center px-4 py-5 border-b border-[#ccc] bg-[#f8fafc]">
      <ChurchLogo size="lg" className="mx-auto mb-3" />
      <EditableBulletinText

        value={churchName}

        editable={canEdit}

        className="text-sm sm:text-base font-bold text-[#1E4D8C] tracking-wide"

        onSave={onSaveChurchName}

      />

      <EditableBulletinText

        value={title}

        editable={canEdit}

        multiline

        className="mt-2 text-xs sm:text-sm font-bold uppercase leading-snug"

        onSave={onSaveTitle}

      />

    </header>

  )

}



function WeekBlock({

  week,

  overrides,

  canEditAssignments,

  canEditText,

  edit,

}: {

  week: BulletinWeek

  overrides: ProtocolBulletinOverrides | null

  canEditAssignments: boolean

  canEditText: boolean

  edit?: BulletinEditProps

}) {

  const [activeCode, setActiveCode] = useState<string | null>(null)

  const weekTitle = resolveWeekTitle(week, overrides)

  const services = BULLETIN_COLUMNS.map((col) => findWeekService(week, col.code))

  const rowCount = maxChoirRows(...services)



  return (

    <section>

      <div className="bg-[#9E9E9E] text-white text-[10px] sm:text-xs font-bold px-2 py-1.5 uppercase">

        <EditableBulletinText

          value={weekTitle}

          editable={canEditText}

          className="text-white font-bold uppercase"

          onSave={(text) =>

            edit?.onBulletinPatch({

              weekTitles: { [String(week.weekIndex)]: text },

            })

          }

        />

      </div>



      <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#bbb] border-t-0">

        {BULLETIN_COLUMNS.map((col) => {

          const service = findWeekService(week, col.code)

          const isActive = activeCode === col.code

          const headerText = service

            ? resolveServiceHeader(service, overrides)

            : col.header



          return (

            <div key={col.code} className="border-[#bbb] border-r last:border-r-0 border-b sm:border-b-0">

              <div

                className="text-center text-[9px] sm:text-[10px] font-bold px-1 py-1.5 leading-tight whitespace-pre-line"

                style={{ backgroundColor: col.headerBg }}

              >

                {service && canEditText ? (

                  <EditableBulletinText

                    value={headerText}

                    editable

                    multiline

                    className="font-bold"

                    onSave={(text) =>

                      edit?.onBulletinPatch({

                        serviceHeaders: { [service.occurrenceId]: text },

                      })

                    }

                  />

                ) : (

                  headerText

                )}

              </div>



              {service ? (

                <ServiceCell

                  service={service}

                  overrides={overrides}

                  rowCount={rowCount}

                  isActive={isActive}

                  canEditAssignments={canEditAssignments}

                  canEditText={canEditText}

                  edit={edit}

                  onToggleActive={() => setActiveCode(isActive ? null : col.code)}

                />

              ) : (

                <div className="min-h-[52px] px-1 py-2 text-center text-[10px] sm:text-xs font-semibold leading-snug text-[#999]">

                  —

                </div>

              )}

            </div>

          )

        })}

      </div>

    </section>

  )

}



function ServiceCell({

  service,

  overrides,

  rowCount,

  isActive,

  canEditAssignments,

  canEditText,

  edit,

  onToggleActive,

}: {

  service: BulletinService

  overrides: ProtocolBulletinOverrides | null

  rowCount: number

  isActive: boolean

  canEditAssignments: boolean

  canEditText: boolean

  edit?: BulletinEditProps

  onToggleActive: () => void

}) {
  const hasCustomText = Boolean(overrides?.cellTexts?.[service.occurrenceId]?.trim())
  const cellText =
    hasCustomText || service.choirs.length > 0
      ? resolveCellText(service, overrides)
      : canEditAssignments
        ? 'Tap to assign'
        : '—'

  const body = (
    <div className="space-y-1">
      <EditableBulletinText
        value={cellText}
        editable={canEditText}
        multiline
        className={cn(
          'text-[10px] sm:text-xs font-semibold leading-snug text-center',
          service.choirs.length === 0 && canEditAssignments && 'text-warning',
        )}
        onSave={(text) =>
          edit?.onBulletinPatch({
            cellTexts: { [service.occurrenceId]: text },
          })
        }
      />
      {canEditAssignments && edit && (
        <p className="text-[9px] text-gold-700 font-medium text-center">
          {isActive ? 'Hide choir picker' : 'Assign choirs'}
        </p>
      )}
    </div>
  )



  if (canEditAssignments && edit) {

    return (

      <>

        <CapabilityGate platformUiCapability="protocol-team-manage">

          <button

            type="button"

            className={cn(

              'w-full min-h-[52px] px-1 py-2',

              isActive ? 'ring-2 ring-inset ring-gold-500 bg-gold-50' : 'hover:bg-[#fafafa]',

            )}

            onClick={onToggleActive}

          >

            {body}

          </button>

        </CapabilityGate>



        {isActive && (

          <div className="p-2 border-t border-[#ddd] bg-white">

            <ProtocolScheduleCellEditor

              planId={edit.planId}

              service={service}

              entries={edit.entriesByOccurrence.get(service.occurrenceId) ?? []}

              choirs={edit.choirs}

              onChanged={edit.onChanged}

              onClose={onToggleActive}

            />

          </div>

        )}

      </>

    )

  }



  return (

    <div className="min-h-[52px] px-1 py-2 text-center" style={{ minHeight: `${rowCount * 1.25 + 1}rem` }}>

      {body}

    </div>

  )

}



function IgaburoBlock({

  service,

  year,

  overrides,

  canEditAssignments,

  canEditText,

  edit,

}: {

  service: BulletinService

  year: number

  overrides: ProtocolBulletinOverrides | null

  canEditAssignments: boolean

  canEditText: boolean

  edit?: BulletinEditProps

}) {

  const [open, setOpen] = useState(false)
  const hasCustomText = Boolean(overrides?.cellTexts?.[service.occurrenceId]?.trim())
  const title = resolveIgaburoTitle(service, year, overrides)

  const cellText =
    hasCustomText || service.choirs.length > 0
      ? resolveCellText(service, overrides)
      : canEditAssignments
        ? 'Tap to assign'
        : '—'

  return (
    <section>
      <div className="bg-[#F5E6A8] text-[10px] sm:text-xs font-bold px-2 py-1.5 uppercase">

        <EditableBulletinText

          value={title}

          editable={canEditText}

          className="font-bold uppercase"

          onSave={(text) =>

            edit?.onBulletinPatch({

              igaburoTitles: { [service.occurrenceId]: text },

            })

          }

        />

      </div>



      {canEditAssignments && edit ? (

        <CapabilityGate platformUiCapability="protocol-team-manage">

          <button

            type="button"

            className={cn(

              'w-full bg-[#E8F4FC] border border-[#bbb] border-t-0 px-3 py-3 text-center text-xs font-semibold',

              open && 'ring-2 ring-inset ring-gold-500',

            )}

            onClick={() => setOpen((value) => !value)}

          >

            <EditableBulletinText

              value={cellText}

              editable={canEditText}

              multiline

              className="font-semibold text-center"

              onSave={(text) =>

                edit.onBulletinPatch({

                  cellTexts: { [service.occurrenceId]: text },

                })

              }

            />

            <p className="text-[9px] text-gold-700 font-medium mt-1">

              {open ? 'Hide choir picker' : 'Assign choirs'}

            </p>

          </button>

        </CapabilityGate>

      ) : (

        <div className="bg-[#E8F4FC] border border-[#bbb] border-t-0 px-3 py-3 text-center text-xs font-semibold whitespace-pre-line">

          {cellText}

        </div>

      )}



      {open && edit && (

        <div className="p-2 border border-[#bbb] border-t-0 bg-white">

          <ProtocolScheduleCellEditor

            planId={edit.planId}

            service={service}

            entries={edit.entriesByOccurrence.get(service.occurrenceId) ?? []}

            choirs={edit.choirs}

            onChanged={edit.onChanged}

            onClose={() => setOpen(false)}

          />

        </div>

      )}

    </section>

  )

}


