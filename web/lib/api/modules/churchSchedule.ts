import { apiClient } from '../client'



export type ChurchFacility = {

  id: string

  code: string

  name: string

  building?: string | null

  floor?: string | null

  capacity?: number | null

  requiresAdminNotify: boolean

  isActive: boolean

  sortOrder: number

}



export type ChurchScheduleScopeType =

  | 'MINISTRY'

  | 'CHOIR'

  | 'PROTOCOL'

  | 'OPERATIONAL_UNIT'



export type ChurchScheduleActivityType =

  | 'PRAYER'

  | 'REHEARSAL'

  | 'MEETING'

  | 'TRAINING'

  | 'CONCERT'

  | 'FELLOWSHIP'

  | 'OTHER_CHURCH_FACING'



export type ChurchScheduleSubmissionStatus =

  | 'DRAFT'

  | 'SUBMITTED'

  | 'AUTO_PUBLISHED'

  | 'CONFLICT_HELD'

  | 'ADMIN_PUBLISHED'

  | 'REJECTED'

  | 'CANCELLED'

  | 'COUNTER_PROPOSED'



export type ScheduleScopeRef = {

  scopeType: ChurchScheduleScopeType

  scopeId: string

  label: string

}



export type ChurchScheduleSubmission = {

  id: string

  scopeType: ChurchScheduleScopeType

  scopeId: string

  title: string

  activityType: ChurchScheduleActivityType

  calendarDate: string

  startAt: string

  endAt: string

  facilityId: string

  purpose?: string | null

  weekOf?: string | null

  notes?: string | null

  status: ChurchScheduleSubmissionStatus

  submittedAt?: string | null

  conflictReason?: string | null

  suggestedAlternatives?: Array<{

    facilityId: string

    facilityName: string

    startAt: string

    endAt: string

    label: string

  }> | null

  rejectionReason?: string | null

  counterProposal?: {

    facilityId: string

    startAt: string

    endAt: string

    reason?: string

  } | null

  facility?: ChurchFacility

  entry?: {

    id: string

    startAt: string

    endAt: string

    source: string

    cancelledAt?: string | null

  } | null

  createdAt: string

  updatedAt: string

}



export type ChurchScheduleEntry = {

  id: string

  source: string

  scopeType?: ChurchScheduleScopeType | null

  scopeId?: string | null

  title: string

  activityType: ChurchScheduleActivityType

  startAt: string

  endAt: string

  facilityId: string

  purpose?: string | null

  isChurchBlock: boolean

  overrideReason?: string | null

  facility?: ChurchFacility

  submission?: {

    id: string

    status: ChurchScheduleSubmissionStatus

    title: string

  } | null

}



export type ResolveConflictAction =

  | 'PUBLISH'

  | 'OVERRIDE'

  | 'REJECT'

  | 'COUNTER_PROPOSE'



export const churchScheduleApi = {

  listFacilities: (params?: { includeInactive?: boolean }) =>

    apiClient.get<never, ChurchFacility[]>('/church/facilities', { params }),



  createFacility: (body: {

    code: string

    name: string

    building?: string

    floor?: string

    capacity?: number

    requiresAdminNotify?: boolean

    isActive?: boolean

    sortOrder?: number

  }) => apiClient.post<never, ChurchFacility>('/church/facilities', body),



  updateFacility: (

    id: string,

    body: {

      code: string

      name: string

      building?: string

      floor?: string

      capacity?: number

      requiresAdminNotify?: boolean

      isActive?: boolean

      sortOrder?: number

    },

  ) => apiClient.patch<never, ChurchFacility>(`/church/facilities/${id}`, body),



  listScopes: () =>

    apiClient.get<never, ScheduleScopeRef[]>('/church/schedule/submissions/scopes'),



  listMySubmissions: (params?: { status?: ChurchScheduleSubmissionStatus }) =>

    apiClient.get<never, ChurchScheduleSubmission[]>(

      '/church/schedule/submissions/mine',

      { params },

    ),



  listConflicts: () =>

    apiClient.get<never, ChurchScheduleSubmission[]>('/church/schedule/conflicts'),



  listTimetable: (params?: {

    from?: string

    to?: string

    facilityId?: string

    scopeType?: string

    scopeId?: string

  }) =>

    apiClient.get<never, ChurchScheduleEntry[]>('/church/schedule/timetable', {

      params,

    }),



  createSubmission: (body: {

    scopeType: ChurchScheduleScopeType

    scopeId: string

    title: string

    activityType: ChurchScheduleActivityType

    calendarDate: string

    startAt: string

    endAt: string

    facilityId: string

    purpose?: string

    weekOf?: string

    notes?: string

  }) =>

    apiClient.post<never, ChurchScheduleSubmission>(

      '/church/schedule/submissions',

      body,

    ),



  updateSubmission: (

    id: string,

    body: Partial<{

      scopeType: ChurchScheduleScopeType

      scopeId: string

      title: string

      activityType: ChurchScheduleActivityType

      calendarDate: string

      startAt: string

      endAt: string

      facilityId: string

      purpose: string

      weekOf: string

      notes: string

    }>,

  ) =>

    apiClient.patch<never, ChurchScheduleSubmission>(

      `/church/schedule/submissions/${id}`,

      body,

    ),



  submitSubmission: (id: string) =>

    apiClient.post<never, ChurchScheduleSubmission>(

      `/church/schedule/submissions/${id}/submit`,

    ),



  acceptCounterProposal: (id: string) =>

    apiClient.post<never, ChurchScheduleSubmission>(

      `/church/schedule/submissions/${id}/accept-counter`,

    ),



  cancelSubmission: (id: string) =>

    apiClient.post<never, ChurchScheduleSubmission>(

      `/church/schedule/submissions/${id}/cancel`,

    ),



  resolveConflict: (

    submissionId: string,

    body: {

      action: ResolveConflictAction

      facilityId?: string

      startAt?: string

      endAt?: string

      reason?: string

    },

  ) =>

    apiClient.post<never, ChurchScheduleSubmission>(

      `/church/schedule/conflicts/${submissionId}/resolve`,

      body,

    ),



  createEntry: (body: {

    title: string

    activityType: ChurchScheduleActivityType

    startAt: string

    endAt: string

    facilityId: string

    purpose?: string

    isChurchBlock?: boolean

    scopeType?: ChurchScheduleScopeType

    scopeId?: string

  }) => apiClient.post<never, ChurchScheduleEntry>('/church/schedule/entries', body),



  cancelEntry: (id: string, reason?: string) =>

    apiClient.post<never, ChurchScheduleEntry>(

      `/church/schedule/entries/${id}/cancel`,

      reason ? { reason } : {},

    ),

}

