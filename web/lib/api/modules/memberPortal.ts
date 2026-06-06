import { apiClient } from '../client'



export interface MemberPortalOccurrence {

  id: string

  title: string

  startAt: string

  endAt: string

  type: string

  templateCode?: string | null

  templateName?: string | null

}



export interface MemberPortalServiceCard {

  code: string

  name: string

  description?: string | null

  nextOccurrence: MemberPortalOccurrence | null

  liveStreamUrl: string | null

  liveStreamRestricted: boolean

  restrictionReason?: string | null

}



export interface TwoDayPrayer {

  id: string

  dayLabel: string

  date: string

  title: string

  content: string

}



export interface WeeklyActivityItem {

  id: string

  title: string

  description?: string | null

  dayOfWeek: number

  dayName: string

  startTime: string

  endTime?: string | null

  location?: string | null

  ministryName?: string | null

  ministryCode?: string | null

  source: 'recurring' | 'meeting'

  scheduledAt?: string

}



export interface DevotionItem {

  id: string

  title: string

  content: string

  verseReference?: string | null

  verseText?: string | null

  type: string

  publishedAt?: string | null

  isPinned?: boolean

}



export interface MemberPortalHome {

  welcome: {

    displayName: string

    firstName: string

    lastName: string

    churchName: string

    welcomeMessage: string | null

    onboardingCompleted: boolean

    memberStatus: string

    pendingApproval: boolean

  }

  location: {

    address: string | null

    city: string | null

    latitude: number | null

    longitude: number | null

    mapEmbedUrl: string | null

    directionsUrl: string | null

  }

  onboarding: { completed: boolean; showPrompt: boolean }

  spiritual: {

    verseOfDay: DevotionItem | null

    livestream: { id: string; title: string; youtubeUrl: string; isLive: boolean } | null

  }

  prayWithUs?: {

    twoDayPrayers: TwoDayPrayer[]

    devotionPath: string

  }

  services: MemberPortalServiceCard[]

  events: MemberPortalOccurrence[]

  weeklyActivitiesPreview?: {

    dayLabel: string | null

    dayOfWeek: number | null

    date: string | null

    activities: WeeklyActivityItem[]

  }

  weeklyActivities: Array<{

    id: string

    title: string

    startAt: string

    location?: string | null

    ministryName: string

    ministryCode: string

    source: 'ministry'

  }>

  ministries: Array<{

    id: string

    name: string

    code: string

    description?: string | null

    memberCount: number

    isMember: boolean

  }>

  choirs: Array<{

    id: string

    name: string

    code: string

    description?: string | null

    choirKind: string

    leader?: string | null

    membershipCount?: number

    showMemberCount?: boolean

    joinStatus: string | null

    pendingRequestId: string | null

    isPublicJoinable?: boolean

  }>

  protocol: {

    status: 'ACTIVE' | 'NONE' | 'PENDING_CLAIM' | 'PENDING_INVITATION'

    isMember: boolean

    canClaim: boolean

    pendingClaim: { id: string; status: string; createdAt: string } | null

    pendingInvitations: Array<{ id: string; invitedBy: string | null }>

    description: string

  }

  announcements: Array<{

    id: string

    title: string

    body: string

    publishedAt: string | null

    pinned: boolean

    source: 'church' | 'choir'

  }>

  liveBroadcast: {

    id: string

    title: string

    youtubeUrl: string

    isLive: boolean

  } | null

}



export interface DevotionCenter {

  verseOfDay: DevotionItem | null

  twoDayPrayers: TwoDayPrayer[]

  prayWithUs: {

    twoDayPrayers: TwoDayPrayer[]

    prayerRequestHint: string

  }

  sections: {

    testimonies: DevotionItem[]

    encouragements: DevotionItem[]

    gratitude: DevotionItem[]

    praises: DevotionItem[]

  }

}



export interface ChoirPublicProfile {

  id: string

  name: string

  code: string

  description?: string | null

  choirKind: string

  leader?: string | null

  isPublicJoinable: boolean

  showMemberCount: boolean

  memberCount?: number

  publicSummary?: string | null

  profileSummary?: string | null

  featuredReleaseOverride?: {

    title: string

    url: string

    platform?: string

    description?: string

  } | null

  featuredRelease?: {

    title: string

    url: string

    platform?: string

    description?: string

  } | null

  joinStatus: string | null

}



export const memberPortalApi = {

  getHome: () =>

    apiClient.get<never, MemberPortalHome>('/member-portal/home'),



  getMembershipCenter: () =>
    apiClient.get<
      never,
      {
        activeChoirs?: Array<{ id: string; name: string; code: string; kind: string }>
        choirs?: Array<{ id: string; choirId: string; role: string; isActive: boolean; choir?: { name: string } }>
        rules?: Record<string, unknown>
      }
    >('/member-portal/membership'),



  getDevotionCenter: () =>

    apiClient.get<never, DevotionCenter>('/member-portal/devotion-center'),



  submitPrayerRequest: (data: {

    content: string

    shareIdentity?: boolean

    displayName?: string

  }) => apiClient.post<never, { id: string }>('/member-portal/prayer-requests', data),



  getWeeklyActivities: () =>

    apiClient.get<never, WeeklyActivityItem[]>('/member-portal/weekly-activities'),



  getWeeklyActivitiesPreview: () =>

    apiClient.get<never, MemberPortalHome['weeklyActivitiesPreview']>(

      '/member-portal/weekly-activities/preview',

    ),



  getChoirPublic: (id: string) =>

    apiClient.get<never, ChoirPublicProfile>(`/member-portal/choirs/${id}/public`),

  getChoirDashboardContext: (id: string) =>
    apiClient.get<
      never,
      import('@/lib/choir/dashboard-context').ChoirDashboardContext
    >(`/member-portal/choirs/${id}/dashboard-context`),

  getChoirMyFamily: (choirId: string) =>
    apiClient.get<
      never,
      import('@/lib/choir/my-family').ChoirMyFamilyResponse
    >(`/member-portal/choirs/${choirId}/my-family`),

  getProtocolDashboardContext: () =>
    apiClient.get<
      never,
      import('@/lib/protocol/dashboard-context').ProtocolDashboardContext
    >('/member-portal/protocol/dashboard-context'),



  getPublicChoirs: () =>

    apiClient.get<never, MemberPortalHome['choirs']>('/choirs/public'),



  getIntercessorInbox: () =>
    apiClient.get<
      never,
      Array<{ id: string; content: string; status: string; createdAt: string; from: string }>
    >('/member-portal/intercessors/prayer-requests'),

  updatePrayerRequestStatus: (id: string, status: 'IN_PRAYER' | 'COMPLETED') =>
    apiClient.patch<never, unknown>(`/member-portal/intercessors/prayer-requests/${id}`, {
      status,
    }),

  updateChoirPublic: (
    id: string,
    data: {
      showMemberCountPublic?: boolean
      publicProfile?: {
        summary?: string
        featuredRelease?: {
          title: string
          url: string
          platform?: string
          description?: string
        } | null
      }
    },
  ) =>
    apiClient.patch<
      never,
      { id: string; showMemberCountPublic: boolean; publicProfileJson: unknown }
    >(`/member-portal/choirs/${id}/public`, data),

}

