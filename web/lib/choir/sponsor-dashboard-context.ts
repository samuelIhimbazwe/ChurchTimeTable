export type ChoirSponsorDashboardContext = {
  choir: {
    id: string
    name: string
    code: string
    choirKind: string
  }
  sponsorship: {
    active: true
    startedAt: string
  } | null
  permissions: string[]
  landingPath: string
  canAccess: boolean
}

export type SponsorCatalogSong = {
  id: string
  title: string
  lyricist?: string | null
  composer?: string | null
  releaseDate?: string | null
  genre?: string | null
  listenLinks: Array<{ platform: string; url: string }>
}

export type PaginatedSponsorSongs = {
  items: SponsorCatalogSong[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type SponsorCatalogSongDetail = SponsorCatalogSong & {
  alternateTitle?: string | null
  language?: string | null
  arranger?: string | null
  conductedBy?: string | null
  producedBy?: string | null
  performedBy?: string | null
  voiceParts?: string | null
  durationSeconds?: number | null
  year?: number | null
  shortSummary?: string | null
  fullDescription?: string | null
  recordingStudio?: string | null
  mixingEngineer?: string | null
  masteringBy?: string | null
  recordingType?: string | null
  copyrightInfo?: string | null
  scriptureReference?: string | null
  category?: string | null
}
