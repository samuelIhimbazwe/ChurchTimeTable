/** Human-readable labels for choir committee position role keys */
export const CHOIR_POSITION_LABELS: Record<string, string> = {
  president: 'President',
  vice_president: 'Vice President',
  music_director: 'Music Director',
  family_coordinator: 'Family Coordinator',
  family_head: 'Family Head',
  advisor: 'Advisor',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  discipline_social_welfare: 'Discipline & Social Welfare',
  spiritual_leader: 'Spiritual Leader',
  choir_member: 'Choir Member',
  choir_leader: 'President',
  vice_leader: 'Vice President',
  discipline_leader: 'Discipline Leader',
  organizer: 'Organizer',
  social_outreach: 'Social Outreach',
  operations_manager: 'Operations Manager',
}

export type ChoirPositionMeta = {
  label: string
  summary: string
  responsibilities: string[]
  permissions: string[]
  actions: string[]
}

/** Default role guide — choir admins can still customize permissions per choir */
export const CHOIR_POSITION_META: Record<string, ChoirPositionMeta> = {
  president: {
    label: 'President',
    summary: 'Overall choir leadership — operations, membership, and coordination with other leaders.',
    responsibilities: [
      'Lead choir governance and major decisions',
      'Oversee activities, roster, and join approvals',
      'Monitor welfare, finance summaries, and reports',
    ],
    permissions: [
      'Full choir operations (events, attendance, scheduling)',
      'View finance and welfare; manage welfare cases',
      'Manage members and review join requests',
      'Reports and devotions oversight',
    ],
    actions: [
      'Approve/reject join requests and assign positions',
      'Create and manage choir activities',
      'View leadership dashboards and export reports',
      'Edit public choir profile',
    ],
  },
  vice_president: {
    label: 'Vice President',
    summary: 'Deputy leader — nearly full presidential authority; stands in when the president is absent.',
    responsibilities: [
      'Lead operations when the president is unavailable',
      'Review join requests, welfare, and discipline with president',
      'Oversee scheduling, activities, and member engagement',
      'Support all officer hubs (care, spiritual, budget, records)',
    ],
    permissions: [
      'Full choir operations bundle (same as president)',
      'Join review, member management, welfare manage',
      'Finance view, reports export, announcements',
      'Devotion publish; access to officer hubs',
    ],
    actions: [
      'Approve/reject join requests and assign positions',
      'Manage activities, attendance, and scheduling',
      'Publish announcements and devotions',
      'Use all officer hubs — care, spiritual, budget, records',
    ],
  },
  music_director: {
    label: 'Music Director',
    summary: 'Leads musical direction, rehearsals, and the music library.',
    responsibilities: [
      'Plan rehearsals and service music',
      'Notify all members which songs to practice or perform',
      'Manage song library and rehearsal attendance',
      'Coordinate voice parts and assignments',
    ],
    permissions: [
      'Music and rehearsal view/manage',
      'Choir announcements & member notify (song lists)',
      'Attendance marking for rehearsals',
      'Assignment and event read/write',
    ],
    actions: [
      'Notify members of rehearsal/service/event song lists',
      'Upload and organize music scores/audio',
      'Schedule and run rehearsals',
      'Mark rehearsal attendance',
    ],
  },
  family_coordinator: {
    label: 'Family Coordinator',
    summary: 'Oversees all choir families — rankings, contributions, attendance, and operations.',
    responsibilities: [
      'Manage every family/team in the choir',
      'Track family rankings (attendance, contributions, participation)',
      'Monitor family-level umusanzu and welfare escalations',
      'Review choir activities and operations across families',
    ],
    permissions: [
      'All families view/manage',
      'Family metrics, rankings, and contribution inbox',
      'Choir ops view, attendance, and reports',
      'Welfare view/manage; member read',
    ],
    actions: [
      'View ranked list of all families',
      'Manage family groupings and assign heads',
      'Track contributions and attendance by family',
      'Follow choir activities and operational reports',
    ],
  },
  family_head: {
    label: 'Family Head',
    summary: 'Leads one choir family — scoped access to their team only.',
    responsibilities: [
      'Shepherd members in their assigned family only',
      'Track team attendance, contributions, and rankings',
      'View family-scoped activities and operations',
      'Report welfare or discipline concerns upward',
    ],
    permissions: [
      'Family view scoped to their team (not other families)',
      'Mark attendance for family members',
      'View family contributions and health ranking',
      'Choir ops view (family context)',
    ],
    actions: [
      'See rankings and metrics for their family only',
      'Mark attendance for family members',
      'View team contribution status',
      'Flag welfare needs to the Family Coordinator',
    ],
  },
  advisor: {
    label: 'Advisor',
    summary: 'Senior counsel — permissions are customized per advisor (operations, development, uniqueness, etc.).',
    responsibilities: [
      'Advise leadership based on assigned focus area',
      'May oversee operations, development, or choir identity',
      'Review reports and governance as permitted',
      'Mentor officers without exceeding assigned permissions',
    ],
    permissions: [
      'Custom — set by President on Position roles',
      'Examples: ops manage, reports, finance view, discipline read',
      'Each advisor may have a different permission bundle',
    ],
    actions: [
      'Use only the tools shown in your Advisor hub',
      'Request permission changes from the President',
      'Counsel leadership using granted read/manage access',
    ],
  },
  secretary: {
    label: 'Secretary',
    summary:
      'Custodian of choir records — activities, operations schedule, music library, assets, uniforms, documents, and audit trail.',
    responsibilities: [
      'Keep accurate records of meetings, decisions, and choir operations',
      'Maintain the activity calendar and what must be done, with times',
      'Curate songs, albums, documents, uniforms, and equipment records',
      'Support leadership with reports and exported summaries',
    ],
    permissions: [
      'Full choir records view (activities, ops schedule, reports)',
      'Music library and rehearsal records (songs/albums)',
      'Documents, meetings, announcements, audit read',
      'Assets, uniforms, and equipment inventory view/report',
      'Events, assignments, attendance, and swap coordination',
    ],
    actions: [
      'View and export choir activity and operations reports',
      'Manage meeting minutes and official choir documents',
      'Maintain music catalog and rehearsal/activity schedules',
      'Track uniforms, equipment, and asset assignments',
      'Review audit logs relevant to choir operations',
    ],
  },
  treasurer: {
    label: 'Treasurer',
    summary:
      'Stewards the choir budget — umusanzu and other contributions, savings, and financial planning for productions and concerts.',
    responsibilities: [
      'Collect and reconcile member contributions (umusanzu, campaigns, projects)',
      'Plan and track budget for recordings, concerts, and major logistics',
      'Prepare financial reports for leadership and members as approved',
      'Coordinate with welfare when financial support is needed',
    ],
    permissions: [
      'Finance view/manage/approve',
      'All contributions view, adjust, types, and campaigns',
      'Financial and choir reports; export',
      'Welfare view (for fund coordination)',
    ],
    actions: [
      'Record and adjust umusanzu and special project contributions',
      'Create/manage contribution types and fundraising campaigns',
      'Plan budgets for audio/video production and live concerts',
      'Export financial summaries for leadership review',
    ],
  },
  discipline_social_welfare: {
    label: 'Discipline & Social Welfare',
    summary:
      'Guardian of choir order and member care — attendance compliance, rules, discipline, notifications, and welfare visits.',
    responsibilities: [
      'Ensure attendance is tracked and choir rules are followed',
      'Publish and share the choir rule charter with all members',
      'Handle discipline cases, warnings, and measures with confidentiality',
      'Open and follow up welfare cases (e.g. visit sick members)',
      'Send notices or messages to members about discipline or wellbeing',
    ],
    permissions: [
      'Full attendance manage/mark and choir ops attendance',
      'Choir rules view/manage and share with members',
      'Discipline read/manage/review',
      'Welfare view/manage; member notify/messages',
      'Announcements for rule updates; family context',
    ],
    actions: [
      'Mark and review attendance; flag rule violations',
      'Publish choir rules and discipline policy to all members',
      'Record warnings, sanctions, and discipline outcomes',
      'Notify members about discipline decisions or welfare follow-up',
      'Create welfare cases and track visits to sick or needy members',
    ],
  },
  spiritual_leader: {
    label: 'Spiritual Leader',
    summary:
      'Shepherds the spiritual life of the choir — prayer, fasting, holiness, intercession (ibyifuzo), and Pentecostal nurture for singers.',
    responsibilities: [
      'Lead prayer and fasting programs aligned with ADEPR emphasis',
      'Oversee intercession requests and two-day prayer content',
      'Publish devotions, encouragement, and holiness-focused teaching',
      'Monitor the spiritual health and unity of the singers',
    ],
    permissions: [
      'Devotion create/publish/manage',
      'Spiritual programs (fasting, prayer calendar)',
      'Intercession inbox (prayer requests)',
      'Spiritual announcements and member notices',
    ],
    actions: [
      'Publish devotions, two-day prayer guides, and encouragements',
      'Schedule fasting/prayer programs for the choir',
      'Review intercession (ibyifuzo) requests and coordinate prayer',
      'Send spiritual reminders and holiness-focused announcements',
    ],
  },
  choir_member: {
    label: 'Choir Member',
    summary: 'Regular participating member — no leadership access.',
    responsibilities: [
      'Attend rehearsals and services',
      'Submit contributions and respond to announcements',
      'Participate in choir spiritual life',
    ],
    permissions: [
      'Portal view; events read',
      'Submit contributions; view music/rehearsals/devotions',
      'View own welfare info when shared',
    ],
    actions: [
      'View schedule and choir announcements',
      'Submit contributions',
      'Access music library and devotions',
    ],
  },
}

export function choirPositionLabel(name: string) {
  return CHOIR_POSITION_LABELS[name] ?? CHOIR_POSITION_META[name]?.label ?? name.replace(/_/g, ' ')
}

export function choirPositionMeta(name: string): ChoirPositionMeta | undefined {
  return CHOIR_POSITION_META[name]
}

export const CHOIR_JOIN_REQUEST_TYPES = [
  { value: 'PERMANENT_MEMBER', label: 'Join as a new member' },
  { value: 'RETURNING_MEMBER', label: 'Already sing in this choir' },
] as const

export const CHOIR_SPONSOR_REQUEST_TYPES = [
  { value: 'NEW_SPONSOR', label: 'Join as a new sponsor' },
  { value: 'EXISTING_SPONSOR', label: 'Already a sponsor of this choir' },
] as const

export type ChoirJoinIntent =
  | 'PERMANENT_MEMBER'
  | 'RETURNING_MEMBER'
  | 'NEW_SPONSOR'
  | 'EXISTING_SPONSOR'

export const CHOIR_JOIN_INTENTS = [
  ...CHOIR_JOIN_REQUEST_TYPES,
  ...CHOIR_SPONSOR_REQUEST_TYPES,
] as const

export function isSponsorJoinIntent(intent: string) {
  return intent === 'NEW_SPONSOR' || intent === 'EXISTING_SPONSOR'
}

/** Permissions choir admins can attach to position roles */
export const CHOIR_POSITION_PERMISSION_OPTIONS = [
  { code: 'event:read', label: 'View events' },
  { code: 'event:write', label: 'Manage events' },
  { code: 'assignment:write', label: 'Manage assignments' },
  { code: 'attendance:write', label: 'Mark attendance' },
  { code: 'attendance.mark', label: 'Attendance (scoped)' },
  { code: 'swap:manage', label: 'Manage swap requests' },
  { code: 'member:read', label: 'View members' },
  { code: 'member:manage', label: 'Manage members' },
  { code: 'choir.join.review', label: 'Review join requests' },
  { code: 'choir.sponsor.review', label: 'Review sponsor requests' },
  { code: 'choir.ops.view', label: 'View choir operations' },
  { code: 'choir.ops.report', label: 'Operations reports' },
  { code: 'choir.ops.schedule', label: 'Operations schedule' },
  { code: 'choir.ops.attendance', label: 'Ops attendance tracking' },
  { code: 'choir.records.view', label: 'View all choir records' },
  { code: 'audit:read', label: 'View audit logs' },
  { code: 'asset.view', label: 'View assets' },
  { code: 'asset.report', label: 'Asset reports' },
  { code: 'choir.uniform.manage', label: 'Manage uniforms' },
  { code: 'choir.equipment.manage', label: 'Manage equipment' },
  { code: 'choir.rules.view', label: 'View choir rules' },
  { code: 'choir.rules.manage', label: 'Manage & share choir rules' },
  { code: 'choir.member.notify', label: 'Notify/message members' },
  { code: 'choir.intercession.manage', label: 'Intercession inbox' },
  { code: 'choir.spiritual.program.manage', label: 'Fasting & prayer programs' },
  { code: 'choir.finance.approve', label: 'Approve finance' },
  { code: 'choir.contribution.type.manage', label: 'Manage contribution types' },
  { code: 'choir.contribution.campaign.manage', label: 'Manage fundraising campaigns' },
  { code: 'ministry.finance.view', label: 'Ministry finance view' },
  { code: 'ministry.finance.report', label: 'Ministry finance reports' },
  { code: 'choir.attendance.manage', label: 'Manage choir attendance' },
  { code: 'choir.events.manage', label: 'Choir events' },
  { code: 'choir.finance.view', label: 'View finance' },
  { code: 'choir.finance.manage', label: 'Manage finance' },
  { code: 'choir.contribution.view.all', label: 'View all contributions' },
  { code: 'choir.contribution.adjust', label: 'Adjust contributions' },
  { code: 'choir.welfare.view', label: 'View welfare' },
  { code: 'choir.welfare.manage', label: 'Manage welfare' },
  { code: 'choir.music.view', label: 'View music library' },
  { code: 'choir.music.manage', label: 'Manage music' },
  { code: 'choir.rehearsal.view', label: 'View rehearsals' },
  { code: 'choir.rehearsal.manage', label: 'Manage rehearsals' },
  { code: 'choir.family.view', label: 'View families' },
  { code: 'choir.family.manage', label: 'Manage families' },
  { code: 'choir.reports.view', label: 'View reports' },
  { code: 'report:export', label: 'Export reports' },
  { code: 'discipline:read_all', label: 'View discipline' },
  { code: 'discipline:manage', label: 'Manage discipline' },
  { code: 'discipline.review', label: 'Review discipline (scoped)' },
  { code: 'choir.announcement.manage', label: 'Manage announcements' },
  { code: 'choir.meeting.manage', label: 'Manage meetings' },
  { code: 'choir.document.manage', label: 'Manage documents' },
  { code: 'member.portal.view', label: 'Member portal' },
  { code: 'choir.contribution.submit', label: 'Submit contributions' },
  { code: 'choir.devotion.view', label: 'View devotions' },
  { code: 'choir.devotion.create', label: 'Create devotions' },
  { code: 'choir.devotion.publish', label: 'Publish devotions' },
  { code: 'choir.devotion.manage', label: 'Manage devotions' },
]
