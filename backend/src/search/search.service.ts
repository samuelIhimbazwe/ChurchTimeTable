import { Injectable } from '@nestjs/common';
import {
  MemberStatus,
  MinistryScope,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OperationalScopeService } from '../governance/operational-scope.service';
import { FamiliesService } from '../families/families.service';
import { ResponseVisibilityService } from '../common/visibility/response-visibility.service';
import { PERMISSIONS } from '../common/constants/roles';
import {
  buildFinanceScopeContext,
} from '../common/governance/finance-scope.util';
import {
  canManageMemberDirectory,
  canViewFamilies,
  canViewFinanceIntelligence,
  hasEffectivePermission,
  hasProtocolCoordination,
  hasProtocolOversight,
} from '../common/governance/governance-permissions.util';
import type { OperationalScopeContext } from '../governance/operational-scope.types';
import { getActiveChoirId } from '../common/choir/choir-context.storage';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { AssetAccessService } from '../assets/asset-access.service';
import { hasGlobalAssetView } from '../assets/asset-access.util';
import { hasGlobalMinistryFinanceView } from '../ministry-finance/ministry-finance-access.util';
import { hasChurchIntelligenceView } from '../church-intelligence/church-intelligence-access.util';

export type SearchEntityType =
  | 'member'
  | 'family'
  | 'event'
  | 'assignment'
  | 'contribution'
  | 'welfareCase'
  | 'welfareCategory'
  | 'song'
  | 'rehearsal'
  | 'choirDocument'
  | 'choirMeeting'
  | 'meetingDecision'
  | 'meetingActionItem'
  | 'songCategory'
  | 'welfareAssistance'
  | 'ministryContent';

export interface MemberSearchResult {
  type: 'member';
  id: string;
  memberNumber: string | null;
  displayName: string;
}

export interface FamilySearchResult {
  type: 'family';
  id: string;
  familyCode: string;
  familyName: string;
}

export interface EventSearchResult {
  type: 'event';
  id: string;
  title: string;
}

export interface AssignmentSearchResult {
  type: 'assignment';
  id: string;
  title: string;
}

export interface ContributionSearchResult {
  type: 'contribution';
  id: string;
  referenceNumber: string;
}

export interface WelfareCaseSearchResult {
  type: 'welfareCase';
  id: string;
  title: string;
  status: string;
  choirId?: string | null;
}

export interface SongSearchResult {
  type: 'song';
  id: string;
  title: string;
}

export interface RehearsalSearchResult {
  type: 'rehearsal';
  id: string;
  eventId: string;
  title: string;
}

export interface WelfareCategorySearchResult {
  type: 'welfareCategory';
  id: string;
  name: string;
}

export interface ChoirDocumentSearchResult {
  type: 'choirDocument';
  id: string;
  title: string;
}

export interface ChoirMeetingSearchResult {
  type: 'choirMeeting';
  id: string;
  title: string;
}

export interface MeetingDecisionSearchResult {
  type: 'meetingDecision';
  id: string;
  meetingId: string;
  decision: string;
}

export interface MeetingActionItemSearchResult {
  type: 'meetingActionItem';
  id: string;
  meetingId: string;
  title: string;
}

export interface SongCategorySearchResult {
  type: 'songCategory';
  id: string;
  name: string;
}

export interface WelfareAssistanceSearchResult {
  type: 'welfareAssistance';
  id: string;
  caseId: string;
  description: string;
}

export type MinistryContentSearchType =
  | 'ministryAnnouncement'
  | 'ministryDocument'
  | 'ministryMeeting'
  | 'ministryActionItem';

export interface MinistryContentSearchResult {
  type: MinistryContentSearchType;
  id: string;
  title: string;
  ministryId: string;
}

export type AssetSearchSubtype =
  | 'asset'
  | 'assetCategory'
  | 'uniform'
  | 'instrument'
  | 'equipment';

export interface AssetSearchResult {
  type: AssetSearchSubtype;
  id: string;
  title: string;
  code?: string;
}

export type MinistryFinanceSearchSubtype = 'fund' | 'budget' | 'expense';

export interface MinistryFinanceSearchResult {
  type: MinistryFinanceSearchSubtype;
  id: string;
  title: string;
  ministryId: string;
}

export type ChurchIntelligenceSearchSubtype =
  | 'healthReport'
  | 'governanceAlert'
  | 'leadershipProfile'
  | 'churchReport';

export interface ChurchIntelligenceSearchResult {
  type: ChurchIntelligenceSearchSubtype;
  id: string;
  title: string;
  subtitle?: string;
  ministryId?: string;
}

export interface ChoirSearchResult {
  type: 'choir';
  id: string;
  title: string;
  code: string;
}

export interface OperationalUnitSearchResult {
  type: 'operationalUnit';
  id: string;
  title: string;
  code: string;
}

export interface MinistrySearchResult {
  type: 'ministry';
  id: string;
  title: string;
  code: string;
}

export interface ScheduleSearchResult {
  type: 'schedule';
  id: string;
  title: string;
  status: string;
}

export interface InvitationSearchResult {
  type: 'invitation';
  id: string;
  title: string;
  status: string;
}

export interface JoinRequestSearchResult {
  type: 'joinRequest';
  id: string;
  title: string;
  status: string;
}

export interface BroadcastSearchResult {
  type: 'broadcast';
  id: string;
  title: string;
}

export interface SearchResponse {
  query: string;
  members: MemberSearchResult[];
  families: FamilySearchResult[];
  events: EventSearchResult[];
  assignments: AssignmentSearchResult[];
  contributions: ContributionSearchResult[];
  welfareCases: WelfareCaseSearchResult[];
  welfareCategories: WelfareCategorySearchResult[];
  songs: SongSearchResult[];
  rehearsals: RehearsalSearchResult[];
  choirDocuments: ChoirDocumentSearchResult[];
  choirMeetings: ChoirMeetingSearchResult[];
  meetingDecisions: MeetingDecisionSearchResult[];
  meetingActionItems: MeetingActionItemSearchResult[];
  songCategories: SongCategorySearchResult[];
  welfareAssistance: WelfareAssistanceSearchResult[];
  ministryContent: MinistryContentSearchResult[];
  assets: AssetSearchResult[];
  ministryFinance: MinistryFinanceSearchResult[];
  churchIntelligence: ChurchIntelligenceSearchResult[];
  choirs: ChoirSearchResult[];
  operationalUnits: OperationalUnitSearchResult[];
  ministries: MinistrySearchResult[];
  schedules: ScheduleSearchResult[];
  invitations: InvitationSearchResult[];
  joinRequests: JoinRequestSearchResult[];
  broadcasts: BroadcastSearchResult[];
}

const DEFAULT_LIMIT = 20;
const SUGGESTION_LIMIT = 10;

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private operationalScope: OperationalScopeService,
    private familiesService: FamiliesService,
    private visibility: ResponseVisibilityService,
    private ministryAccess: MinistryAccessService,
    private assetAccess: AssetAccessService,
  ) {}

  private canSearchAssets(permissions: string[]): boolean {
    return hasGlobalAssetView(permissions);
  }

  private canSearchMinistryFinance(permissions: string[]): boolean {
    return hasGlobalMinistryFinanceView(permissions);
  }

  private canSearchChurchIntelligence(permissions: string[]): boolean {
    return hasChurchIntelligenceView(permissions);
  }

  private normalizeQuery(query: string): string {
    return query.trim();
  }

  private canSearchMembers(ctx: OperationalScopeContext): boolean {
    return (
      hasEffectivePermission(ctx.permissions, PERMISSIONS.MEMBER_READ) ||
      canManageMemberDirectory(ctx.permissions)
    );
  }

  private canSearchEvents(ctx: OperationalScopeContext): boolean {
    return hasEffectivePermission(ctx.permissions, PERMISSIONS.EVENT_READ);
  }

  private canSearchAssignments(ctx: OperationalScopeContext): boolean {
    return (
      this.canSearchEvents(ctx) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.ASSIGNMENT_WRITE)
    );
  }

  private canSearchContributions(ctx: OperationalScopeContext): boolean {
    return canViewFinanceIntelligence(ctx.permissions);
  }

  private canSearchWelfareCases(ctx: OperationalScopeContext): boolean {
    return (
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_WELFARE_VIEW) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_WELFARE_MANAGE)
    );
  }

  private canSearchSongs(ctx: OperationalScopeContext): boolean {
    return (
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_MUSIC_VIEW) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_MUSIC_MANAGE)
    );
  }

  private canSearchRehearsals(ctx: OperationalScopeContext): boolean {
    return (
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_REHEARSAL_VIEW) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_REHEARSAL_MANAGE) ||
      this.canSearchSongs(ctx)
    );
  }

  private canSearchChoirDocuments(ctx: OperationalScopeContext): boolean {
    return (
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_DOCUMENT_MANAGE) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_OPERATIONS_MANAGE)
    );
  }

  private canSearchMinistryContent(permissions: string[]): boolean {
    return (
      hasEffectivePermission(permissions, PERMISSIONS.MINISTRY_VIEW) ||
      hasEffectivePermission(permissions, PERMISSIONS.MINISTRY_ANNOUNCEMENT_VIEW) ||
      hasEffectivePermission(permissions, PERMISSIONS.MINISTRY_DOCUMENT_VIEW) ||
      hasEffectivePermission(permissions, PERMISSIONS.MINISTRY_MEETING_VIEW) ||
      hasEffectivePermission(permissions, PERMISSIONS.MINISTRY_MANAGE)
    );
  }

  private canSearchChoirMeetings(ctx: OperationalScopeContext): boolean {
    return (
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_MEETING_MANAGE) ||
      hasEffectivePermission(ctx.permissions, PERMISSIONS.CHOIR_OPERATIONS_MANAGE)
    );
  }

  private isGlobalAdmin(ctx: OperationalScopeContext): boolean {
    return canManageMemberDirectory(ctx.permissions);
  }

  private ministryScopesForActor(
    ctx: OperationalScopeContext,
  ): MinistryScope[] {
    if (this.isGlobalAdmin(ctx)) {
      return [MinistryScope.CHOIR, MinistryScope.PROTOCOL, MinistryScope.BOTH];
    }

    const scopes = new Set<MinistryScope>();
    if (
      ctx.canChoirOperations ||
      ctx.ministryIds.includes(MinistryScope.CHOIR)
    ) {
      scopes.add(MinistryScope.CHOIR);
      scopes.add(MinistryScope.BOTH);
    }
    if (
      ctx.canProtocolOversight ||
      ctx.canProtocolCoordinate ||
      ctx.canProtocolTeamHead
    ) {
      scopes.add(MinistryScope.PROTOCOL);
      scopes.add(MinistryScope.BOTH);
    }

    return [...scopes];
  }

  private buildMemberWhere(
    ctx: OperationalScopeContext,
    query: string,
  ): Prisma.MemberWhereInput {
    const textFilter: Prisma.MemberWhereInput = {
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { memberNumber: { contains: query } },
      ],
    };

    const base: Prisma.MemberWhereInput = {
      AND: [textFilter, { status: MemberStatus.ACTIVE }],
    };

    if (this.isGlobalAdmin(ctx)) {
      return base;
    }

    const narrowToTeam =
      ctx.scopedMemberIds.length > 0 &&
      !hasProtocolOversight(ctx.permissions) &&
      !hasProtocolCoordination(ctx.permissions);

    if (narrowToTeam) {
      return {
        AND: [textFilter, { id: { in: ctx.scopedMemberIds }, status: MemberStatus.ACTIVE }],
      };
    }

    const ministries = this.ministryScopesForActor(ctx);
    if (ministries.length) {
      return {
        AND: [
          textFilter,
          { status: MemberStatus.ACTIVE },
          { ministry: { in: ministries } },
        ],
      };
    }

    return { id: '__none__' };
  }

  private buildEventWhere(
    ctx: OperationalScopeContext,
    query: string,
  ): Prisma.EventWhereInput {
    const textFilter = { title: { contains: query } };
    if (this.isGlobalAdmin(ctx)) {
      return textFilter;
    }

    const ministries = this.ministryScopesForActor(ctx);
    if (!ministries.length) {
      return { id: '__none__' };
    }

    return { AND: [textFilter, { ministryScope: { in: ministries } }] };
  }

  private perTypeLimit(totalLimit: number, enabledTypes: number): number {
    if (enabledTypes <= 0) return 0;
    return Math.max(1, Math.ceil(totalLimit / enabledTypes));
  }

  private serializeResponse(
    query: string,
    members: MemberSearchResult[],
    families: FamilySearchResult[],
    events: EventSearchResult[],
    assignments: AssignmentSearchResult[],
    contributions: ContributionSearchResult[],
    welfareCases: WelfareCaseSearchResult[],
    welfareCategories: WelfareCategorySearchResult[],
    songs: SongSearchResult[],
    rehearsals: RehearsalSearchResult[],
    choirDocuments: ChoirDocumentSearchResult[],
    choirMeetings: ChoirMeetingSearchResult[],
    meetingDecisions: MeetingDecisionSearchResult[],
    meetingActionItems: MeetingActionItemSearchResult[],
    songCategories: SongCategorySearchResult[],
    welfareAssistance: WelfareAssistanceSearchResult[],
    ministryContent: MinistryContentSearchResult[],
    assets: AssetSearchResult[],
    ministryFinance: MinistryFinanceSearchResult[],
    churchIntelligence: ChurchIntelligenceSearchResult[],
    permissions: string[],
    choirs: ChoirSearchResult[] = [],
    operationalUnits: OperationalUnitSearchResult[] = [],
    ministries: MinistrySearchResult[] = [],
    schedules: ScheduleSearchResult[] = [],
    invitations: InvitationSearchResult[] = [],
    joinRequests: JoinRequestSearchResult[] = [],
    broadcasts: BroadcastSearchResult[] = [],
  ): SearchResponse {
    const payload: SearchResponse = {
      query,
      members,
      families,
      events,
      assignments,
      contributions,
      welfareCases,
      welfareCategories,
      songs,
      rehearsals,
      choirDocuments,
      choirMeetings,
      meetingDecisions,
      meetingActionItems,
      songCategories,
      welfareAssistance,
      ministryContent,
      assets,
      ministryFinance,
      churchIntelligence,
      choirs,
      operationalUnits,
      ministries,
      schedules,
      invitations,
      joinRequests,
      broadcasts,
    };
    return this.visibility.filterSearchResponse(payload, permissions);
  }

  async search(actorUserId: string, rawQuery: string): Promise<SearchResponse> {
    return this.execute(actorUserId, rawQuery, DEFAULT_LIMIT);
  }

  async suggestions(actorUserId: string, rawQuery: string): Promise<SearchResponse> {
    return this.execute(actorUserId, rawQuery, SUGGESTION_LIMIT);
  }

  private async execute(
    actorUserId: string,
    rawQuery: string,
    totalLimit: number,
  ): Promise<SearchResponse> {
    const query = this.normalizeQuery(rawQuery);
    if (!query) {
      return this.serializeResponse(
        query,
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
      );
    }

    const ctx = await this.operationalScope.buildForUser(actorUserId);
    const financeCtx = buildFinanceScopeContext(ctx);

    const enabled: Array<SearchEntityType> = [];
    if (this.canSearchMembers(ctx)) enabled.push('member');
    if (canViewFamilies(ctx.permissions)) enabled.push('family');
    if (this.canSearchEvents(ctx)) enabled.push('event');
    if (this.canSearchAssignments(ctx)) enabled.push('assignment');
    if (this.canSearchContributions(ctx)) enabled.push('contribution');
    if (this.canSearchWelfareCases(ctx)) enabled.push('welfareCase');
    if (this.canSearchWelfareCases(ctx)) enabled.push('welfareCategory');
    if (this.canSearchSongs(ctx)) enabled.push('song');
    if (this.canSearchRehearsals(ctx)) enabled.push('rehearsal');
    if (this.canSearchChoirDocuments(ctx)) enabled.push('choirDocument');
    if (this.canSearchChoirMeetings(ctx)) enabled.push('choirMeeting');
    if (this.canSearchChoirMeetings(ctx)) enabled.push('meetingDecision');
    if (this.canSearchChoirMeetings(ctx)) enabled.push('meetingActionItem');
    if (this.canSearchSongs(ctx)) enabled.push('songCategory');
    if (this.canSearchWelfareCases(ctx)) enabled.push('welfareAssistance');
    if (this.canSearchMinistryContent(ctx.permissions)) enabled.push('ministryContent');

    const typeLimit = this.perTypeLimit(totalLimit, enabled.length);

    const [
      members,
      families,
      events,
      assignments,
      contributions,
      welfareCases,
      welfareCategories,
      songs,
      rehearsals,
      choirDocuments,
      choirMeetings,
      meetingDecisions,
      meetingActionItems,
      songCategories,
      welfareAssistance,
      ministryContent,
      assets,
      ministryFinance,
      churchIntelligence,
      pilotExtended,
    ] = await Promise.all([
      this.canSearchMembers(ctx)
        ? this.searchMembers(ctx, query, typeLimit)
        : Promise.resolve([]),
      canViewFamilies(ctx.permissions)
        ? this.searchFamilies(ctx, query, typeLimit)
        : Promise.resolve([]),
      this.canSearchEvents(ctx)
        ? this.searchEvents(ctx, query, typeLimit)
        : Promise.resolve([]),
      this.canSearchAssignments(ctx)
        ? this.searchAssignments(ctx, query, typeLimit)
        : Promise.resolve([]),
      this.canSearchContributions(ctx)
        ? this.searchContributions(financeCtx, query, typeLimit)
        : Promise.resolve([]),
      this.canSearchWelfareCases(ctx)
        ? this.searchWelfareCases(query, typeLimit)
        : Promise.resolve([]),
      this.canSearchWelfareCases(ctx)
        ? this.searchWelfareCategories(query, typeLimit)
        : Promise.resolve([]),
      this.canSearchSongs(ctx)
        ? this.searchSongs(query, typeLimit)
        : Promise.resolve([]),
      this.canSearchRehearsals(ctx)
        ? this.searchRehearsals(ctx, query, typeLimit)
        : Promise.resolve([]),
      this.canSearchChoirDocuments(ctx)
        ? this.searchChoirDocuments(query, typeLimit)
        : Promise.resolve([]),
      this.canSearchChoirMeetings(ctx)
        ? this.searchChoirMeetings(query, typeLimit)
        : Promise.resolve([]),
      this.canSearchChoirMeetings(ctx)
        ? this.searchMeetingDecisions(query, typeLimit)
        : Promise.resolve([]),
      this.canSearchChoirMeetings(ctx)
        ? this.searchMeetingActionItems(query, typeLimit)
        : Promise.resolve([]),
      this.canSearchSongs(ctx)
        ? this.searchSongCategories(query, typeLimit)
        : Promise.resolve([]),
      this.canSearchWelfareCases(ctx)
        ? this.searchWelfareAssistance(query, typeLimit)
        : Promise.resolve([]),
      this.canSearchMinistryContent(ctx.permissions)
        ? this.searchMinistryContent(actorUserId, query, typeLimit)
        : Promise.resolve([]),
      this.canSearchAssets(ctx.permissions)
        ? this.searchAssets(actorUserId, query, typeLimit)
        : Promise.resolve([]),
      this.canSearchMinistryFinance(ctx.permissions)
        ? this.searchMinistryFinance(actorUserId, query, typeLimit)
        : Promise.resolve([]),
      this.canSearchChurchIntelligence(ctx.permissions)
        ? this.searchChurchIntelligence(actorUserId, query, typeLimit)
        : Promise.resolve([]),
      this.searchPilotExtended(actorUserId, query, typeLimit, ctx.permissions),
    ]);

    let remaining = totalLimit;
    const take = <T>(items: T[]) => {
      const slice = items.slice(0, remaining);
      remaining = Math.max(0, remaining - slice.length);
      return slice;
    };

    return this.serializeResponse(
      query,
      take(members),
      take(families),
      take(events),
      take(assignments),
      take(contributions),
      take(welfareCases),
      take(welfareCategories),
      take(songs),
      take(rehearsals),
      take(choirDocuments),
      take(choirMeetings),
      take(meetingDecisions),
      take(meetingActionItems),
      take(songCategories),
      take(welfareAssistance),
      take(ministryContent),
      take(assets),
      take(ministryFinance),
      take(churchIntelligence),
      ctx.permissions,
      take(pilotExtended.choirs),
      take(pilotExtended.operationalUnits),
      take(pilotExtended.ministries),
      take(pilotExtended.schedules),
      take(pilotExtended.invitations),
      take(pilotExtended.joinRequests),
      take(pilotExtended.broadcasts),
    );
  }

  private async searchPilotExtended(
    _actorUserId: string,
    query: string,
    limit: number,
    permissions: string[],
  ): Promise<{
    choirs: ChoirSearchResult[];
    operationalUnits: OperationalUnitSearchResult[];
    ministries: MinistrySearchResult[];
    schedules: ScheduleSearchResult[];
    invitations: InvitationSearchResult[];
    joinRequests: JoinRequestSearchResult[];
    broadcasts: BroadcastSearchResult[];
  }> {
    const text = { contains: query };

    const canChoirs =
      hasEffectivePermission(permissions, PERMISSIONS.MEMBER_READ) ||
      hasEffectivePermission(permissions, PERMISSIONS.MEMBER_PORTAL_VIEW) ||
      hasEffectivePermission(permissions, PERMISSIONS.CHOIR_OPS_VIEW);
    const canUnits = hasEffectivePermission(
      permissions,
      PERMISSIONS.OPERATIONAL_UNIT_VIEW,
    );
    const canMinistries = hasEffectivePermission(
      permissions,
      PERMISSIONS.MINISTRY_VIEW,
    );
    const canSchedules = hasEffectivePermission(
      permissions,
      PERMISSIONS.EVENT_READ,
    );
    const canInvites =
      hasEffectivePermission(permissions, PERMISSIONS.PROTOCOL_INVITE) ||
      hasEffectivePermission(permissions, PERMISSIONS.MEMBER_PORTAL_VIEW);
    const canJoinReview = hasEffectivePermission(
      permissions,
      PERMISSIONS.CHOIR_JOIN_REVIEW,
    );
    const canBroadcasts =
      hasEffectivePermission(permissions, PERMISSIONS.MEMBER_PORTAL_VIEW) ||
      hasEffectivePermission(permissions, PERMISSIONS.ADMIN_USERS_VIEW);

    const [choirs, operationalUnits, ministries, schedules, invitations, joinRequests, broadcasts] =
      await Promise.all([
        canChoirs
          ? this.prisma.choir.findMany({
              where: { OR: [{ name: text }, { code: text }] },
              take: limit,
              select: { id: true, name: true, code: true },
            })
          : Promise.resolve([]),
        canUnits
          ? this.prisma.operationalUnit.findMany({
              where: { OR: [{ name: text }, { code: text }] },
              take: limit,
              select: { id: true, name: true, code: true },
            })
          : Promise.resolve([]),
        canMinistries
          ? this.prisma.ministry.findMany({
              where: { OR: [{ name: text }, { code: text }] },
              take: limit,
              select: { id: true, name: true, code: true },
            })
          : Promise.resolve([]),
        canSchedules
          ? this.prisma.operationOccurrence.findMany({
              where: { title: text },
              take: limit,
              select: { id: true, title: true, status: true },
            })
          : Promise.resolve([]),
        canInvites
          ? this.prisma.protocolInvitation.findMany({
              where: {
                OR: [
                  { message: text },
                  {
                    member: {
                      OR: [{ firstName: text }, { lastName: text }],
                    },
                  },
                ],
              },
              take: limit,
              select: {
                id: true,
                status: true,
                message: true,
                member: { select: { firstName: true, lastName: true } },
              },
            })
          : Promise.resolve([]),
        canJoinReview
          ? this.prisma.choirJoinRequest.findMany({
              where: { choir: { name: text } },
              take: limit,
              select: { id: true, status: true, choir: { select: { name: true } } },
            })
          : Promise.resolve([]),
        canBroadcasts
          ? this.prisma.churchBroadcast.findMany({
              where: { title: text },
              take: limit,
              select: { id: true, title: true },
            })
          : Promise.resolve([]),
      ]);

    return {
      choirs: choirs.map((c) => ({
        type: 'choir' as const,
        id: c.id,
        title: c.name,
        code: c.code,
      })),
      operationalUnits: operationalUnits.map((u) => ({
        type: 'operationalUnit' as const,
        id: u.id,
        title: u.name,
        code: u.code,
      })),
      ministries: ministries.map((m) => ({
        type: 'ministry' as const,
        id: m.id,
        title: m.name,
        code: m.code,
      })),
      schedules: schedules.map((s) => ({
        type: 'schedule' as const,
        id: s.id,
        title: s.title,
        status: String(s.status),
      })),
      invitations: invitations.map((i) => ({
        type: 'invitation' as const,
        id: i.id,
        title:
          i.message?.trim() ||
          `${i.member.firstName} ${i.member.lastName}`.trim() ||
          i.id,
        status: String(i.status),
      })),
      joinRequests: joinRequests.map((j) => ({
        type: 'joinRequest' as const,
        id: j.id,
        title: j.choir?.name ?? j.id,
        status: String(j.status),
      })),
      broadcasts: broadcasts.map((b) => ({
        type: 'broadcast' as const,
        id: b.id,
        title: b.title,
      })),
    };
  }

  private async searchChurchIntelligence(
    actorUserId: string,
    query: string,
    limit: number,
  ): Promise<ChurchIntelligenceSearchResult[]> {
    const visible = await this.ministryAccess.ministryIdsVisibleTo(actorUserId);
    const ministryWhere =
      visible === null ? {} : { id: { in: visible } };
    const text = { contains: query };

    const ministries = await this.prisma.ministry.findMany({
      where: { ...ministryWhere, OR: [{ name: text }, { code: text }] },
      take: limit,
      select: { id: true, name: true, code: true },
    });

    const leaders = await this.prisma.member.findMany({
      where: {
        OR: [{ firstName: text }, { lastName: text }],
        ministryLeadershipAssignments: {
          some: { endedAt: null },
        },
      },
      take: limit,
      select: { id: true, firstName: true, lastName: true },
    });

    return [
      ...ministries.map((m) => ({
        type: 'healthReport' as const,
        id: m.id,
        title: m.name,
        subtitle: `Ministry health · ${m.code}`,
        ministryId: m.id,
      })),
      ...leaders.map((l) => ({
        type: 'leadershipProfile' as const,
        id: l.id,
        title: `${l.firstName} ${l.lastName}`.trim(),
        subtitle: 'Leadership analytics',
      })),
      {
        type: 'churchReport' as const,
        id: 'growth-summary',
        title: 'Growth summary',
        subtitle: 'Church intelligence report',
      },
      {
        type: 'governanceAlert' as const,
        id: 'governance-alerts',
        title: 'Governance alerts',
        subtitle: 'Church governance',
      },
    ].slice(0, limit);
  }

  private async searchMinistryFinance(
    actorUserId: string,
    query: string,
    limit: number,
  ): Promise<MinistryFinanceSearchResult[]> {
    const visible = await this.ministryAccess.ministryIdsVisibleTo(actorUserId);
    const ministryWhere =
      visible === null ? {} : { ministryId: { in: visible } };
    const text = { contains: query };

    const [funds, budgets, expenses] = await Promise.all([
      this.prisma.ministryFund.findMany({
        where: { ...ministryWhere, isActive: true, name: text },
        take: limit,
        select: { id: true, name: true, ministryId: true },
      }),
      this.prisma.ministryBudget.findMany({
        where: { ...ministryWhere, name: text },
        take: limit,
        select: { id: true, name: true, ministryId: true },
      }),
      this.prisma.ministryExpense.findMany({
        where: { ...ministryWhere, description: text },
        take: limit,
        select: { id: true, description: true, ministryId: true },
      }),
    ]);

    return [
      ...funds.map((f) => ({
        type: 'fund' as const,
        id: f.id,
        title: f.name,
        ministryId: f.ministryId,
      })),
      ...budgets.map((b) => ({
        type: 'budget' as const,
        id: b.id,
        title: b.name,
        ministryId: b.ministryId,
      })),
      ...expenses.map((e) => ({
        type: 'expense' as const,
        id: e.id,
        title: e.description,
        ministryId: e.ministryId,
      })),
    ].slice(0, limit);
  }

  private async searchAssets(
    actorUserId: string,
    query: string,
    limit: number,
  ): Promise<AssetSearchResult[]> {
    const scope = await this.assetAccess.visibleAssetWhere(actorUserId);
    const text = { contains: query };

    const [assetRows, categories, uniforms, instruments] = await Promise.all([
      this.prisma.asset.findMany({
        where: {
          ...scope,
          OR: [{ name: text }, { code: text }, { serialNumber: text }],
        },
        take: limit,
        select: { id: true, name: true, code: true },
      }),
      this.prisma.assetCategory.findMany({
        where: { OR: [{ name: text }, { code: text }] },
        take: limit,
        select: { id: true, name: true, code: true },
      }),
      this.prisma.uniformProfile.findMany({
        where: {
          asset: { ...scope, OR: [{ name: text }, { code: text }] },
        },
        take: limit,
        select: { assetId: true, asset: { select: { name: true, code: true } } },
      }),
      this.prisma.instrumentProfile.findMany({
        where: {
          OR: [{ instrumentType: text }],
          asset: { ...scope, OR: [{ name: text }, { code: text }] },
        },
        take: limit,
        select: {
          assetId: true,
          instrumentType: true,
          asset: { select: { name: true, code: true } },
        },
      }),
    ]);

    const results: AssetSearchResult[] = [
      ...assetRows.map((r) => ({
        type: 'asset' as const,
        id: r.id,
        title: r.name,
        code: r.code,
      })),
      ...categories.map((r) => ({
        type: 'assetCategory' as const,
        id: r.id,
        title: r.name,
        code: r.code,
      })),
      ...uniforms.map((r) => ({
        type: 'uniform' as const,
        id: r.assetId,
        title: r.asset.name,
        code: r.asset.code,
      })),
      ...instruments.map((r) => ({
        type: 'instrument' as const,
        id: r.assetId,
        title: `${r.asset.name} (${r.instrumentType})`,
        code: r.asset.code,
      })),
    ];

    const equipmentCategory = await this.prisma.assetCategory.findUnique({
      where: { code: 'AUDIO' },
    });
    if (equipmentCategory) {
      const equipment = await this.prisma.asset.findMany({
        where: {
          ...scope,
          categoryId: { in: [equipmentCategory.id] },
          OR: [{ name: text }, { code: text }],
        },
        take: limit,
        select: { id: true, name: true, code: true },
      });
      for (const e of equipment) {
        results.push({
          type: 'equipment',
          id: e.id,
          title: e.name,
          code: e.code,
        });
      }
    }

    return results.slice(0, limit);
  }

  private async searchMinistryContent(
    actorUserId: string,
    query: string,
    limit: number,
  ): Promise<MinistryContentSearchResult[]> {
    const visible = await this.ministryAccess.ministryIdsVisibleTo(actorUserId);
    const ministryWhere =
      visible === null ? {} : { ministryId: { in: visible } };
    const text = { contains: query };

    const [announcements, documents, meetings, actionItems] = await Promise.all([
      this.prisma.ministryAnnouncement.findMany({
        where: {
          ...ministryWhere,
          isActive: true,
          title: text,
        },
        take: limit,
        select: { id: true, title: true, ministryId: true },
      }),
      this.prisma.ministryDocument.findMany({
        where: {
          ...ministryWhere,
          isArchived: false,
          title: text,
        },
        take: limit,
        select: { id: true, title: true, ministryId: true },
      }),
      this.prisma.ministryMeeting.findMany({
        where: {
          ...ministryWhere,
          title: text,
        },
        take: limit,
        select: { id: true, title: true, ministryId: true },
      }),
      this.prisma.ministryMeetingActionItem.findMany({
        where: {
          meeting: ministryWhere,
          title: text,
        },
        take: limit,
        select: {
          id: true,
          title: true,
          meeting: { select: { ministryId: true } },
        },
      }),
    ]);

    const results: MinistryContentSearchResult[] = [
      ...announcements.map((r) => ({
        type: 'ministryAnnouncement' as const,
        id: r.id,
        title: r.title,
        ministryId: r.ministryId,
      })),
      ...documents.map((r) => ({
        type: 'ministryDocument' as const,
        id: r.id,
        title: r.title,
        ministryId: r.ministryId,
      })),
      ...meetings.map((r) => ({
        type: 'ministryMeeting' as const,
        id: r.id,
        title: r.title,
        ministryId: r.ministryId,
      })),
      ...actionItems.map((r) => ({
        type: 'ministryActionItem' as const,
        id: r.id,
        title: r.title,
        ministryId: r.meeting.ministryId,
      })),
    ];

    return results.slice(0, limit);
  }

  private async searchMembers(
    ctx: OperationalScopeContext,
    query: string,
    limit: number,
  ): Promise<MemberSearchResult[]> {
    const rows = await this.prisma.member.findMany({
      where: this.buildMemberWhere(ctx, query),
      take: limit,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        memberNumber: true,
        firstName: true,
        lastName: true,
      },
    });

    return rows.map((row) => ({
      type: 'member' as const,
      id: row.id,
      memberNumber: row.memberNumber,
      displayName: `${row.firstName} ${row.lastName}`.trim(),
    }));
  }

  private async searchFamilies(
    ctx: OperationalScopeContext,
    query: string,
    limit: number,
  ): Promise<FamilySearchResult[]> {
    this.familiesService.ensureViewAccess(ctx);
    const scopeWhere = this.familiesService.buildScopeWhere(ctx);

    const rows = await this.prisma.family.findMany({
      where: {
        AND: [
          scopeWhere,
          {
            OR: [
              { familyName: { contains: query } },
              { familyCode: { contains: query } },
            ],
          },
        ],
      },
      take: limit,
      orderBy: { familyName: 'asc' },
      select: {
        id: true,
        familyCode: true,
        familyName: true,
      },
    });

    return rows.map((row) => ({
      type: 'family' as const,
      id: row.id,
      familyCode: row.familyCode,
      familyName: row.familyName,
    }));
  }

  private async searchEvents(
    ctx: OperationalScopeContext,
    query: string,
    limit: number,
  ): Promise<EventSearchResult[]> {
    const rows = await this.prisma.event.findMany({
      where: this.buildEventWhere(ctx, query),
      take: limit,
      orderBy: { startTime: 'desc' },
      select: { id: true, title: true },
    });

    return rows.map((row) => ({
      type: 'event' as const,
      id: row.id,
      title: row.title,
    }));
  }

  private async searchAssignments(
    ctx: OperationalScopeContext,
    query: string,
    limit: number,
  ): Promise<AssignmentSearchResult[]> {
    const eventWhere = this.buildEventWhere(ctx, query);
    const assignmentWhere: Prisma.EventAssignmentWhereInput = {
      event: eventWhere,
    };

    if (
      !this.isGlobalAdmin(ctx) &&
      ctx.scopedMemberIds.length > 0 &&
      !hasProtocolOversight(ctx.permissions) &&
      !hasProtocolCoordination(ctx.permissions)
    ) {
      assignmentWhere.memberId = { in: ctx.scopedMemberIds };
    }

    const rows = await this.prisma.eventAssignment.findMany({
      where: assignmentWhere,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        event: { select: { title: true } },
      },
    });

    return rows.map((row) => ({
      type: 'assignment' as const,
      id: row.id,
      title: row.event.title,
    }));
  }

  private async searchContributions(
    financeCtx: ReturnType<typeof buildFinanceScopeContext>,
    query: string,
    limit: number,
  ): Promise<ContributionSearchResult[]> {
    if (!financeCtx.ministryScopes.length) {
      return [];
    }

    const rows = await this.prisma.contributionRecord.findMany({
      where: {
        referenceNumber: { contains: query },
        member: { ministry: { in: financeCtx.ministryScopes } },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        referenceNumber: true,
      },
    });

    return rows.map((row) => ({
      type: 'contribution' as const,
      id: row.id,
      referenceNumber: row.referenceNumber,
    }));
  }

  private choirScopeOrLegacy(choirId = getActiveChoirId()) {
    return { OR: [{ choirId }, { choirId: null }] };
  }

  private async searchWelfareCases(
    query: string,
    limit: number,
  ): Promise<WelfareCaseSearchResult[]> {
    const rows = await this.prisma.welfareCase.findMany({
      where: {
        AND: [
          this.choirScopeOrLegacy(),
          {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
            ],
          },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, status: true, choirId: true },
    });
    return rows.map((row) => ({
      type: 'welfareCase' as const,
      id: row.id,
      title: row.title,
      status: row.status,
      choirId: row.choirId,
    }));
  }

  private async searchSongs(
    query: string,
    limit: number,
  ): Promise<SongSearchResult[]> {
    const rows = await this.prisma.song.findMany({
      where: {
        AND: [
          { active: true },
          this.choirScopeOrLegacy(),
          {
            OR: [
              { title: { contains: query } },
              { alternateTitle: { contains: query } },
              { composer: { contains: query } },
              { lyricsText: { contains: query } },
            ],
          },
        ],
      },
      take: limit,
      orderBy: { title: 'asc' },
      select: { id: true, title: true },
    });
    return rows.map((row) => ({
      type: 'song' as const,
      id: row.id,
      title: row.title,
    }));
  }

  private async searchWelfareCategories(
    query: string,
    limit: number,
  ): Promise<WelfareCategorySearchResult[]> {
    const rows = await this.prisma.welfareCategory.findMany({
      where: {
        OR: [{ name: { contains: query } }, { description: { contains: query } }],
      },
      take: limit,
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return rows.map((row) => ({
      type: 'welfareCategory' as const,
      id: row.id,
      name: row.name,
    }));
  }

  private async searchChoirDocuments(
    query: string,
    limit: number,
  ): Promise<ChoirDocumentSearchResult[]> {
    const rows = await this.prisma.choirDocument.findMany({
      where: {
        OR: [{ title: { contains: query } }, { description: { contains: query } }],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true },
    });
    return rows.map((row) => ({
      type: 'choirDocument' as const,
      id: row.id,
      title: row.title,
    }));
  }

  private async searchChoirMeetings(
    query: string,
    limit: number,
  ): Promise<ChoirMeetingSearchResult[]> {
    const rows = await this.prisma.choirMeeting.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { agenda: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { scheduledAt: 'desc' },
      select: { id: true, title: true },
    });
    return rows.map((row) => ({
      type: 'choirMeeting' as const,
      id: row.id,
      title: row.title,
    }));
  }

  private async searchMeetingDecisions(
    query: string,
    limit: number,
  ): Promise<MeetingDecisionSearchResult[]> {
    const rows = await this.prisma.meetingDecision.findMany({
      where: { decision: { contains: query } },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, meetingId: true, decision: true },
    });
    return rows.map((row) => ({
      type: 'meetingDecision' as const,
      id: row.id,
      meetingId: row.meetingId,
      decision: row.decision,
    }));
  }

  private async searchMeetingActionItems(
    query: string,
    limit: number,
  ): Promise<MeetingActionItemSearchResult[]> {
    const rows = await this.prisma.meetingActionItem.findMany({
      where: { title: { contains: query } },
      take: limit,
      orderBy: { dueAt: 'asc' },
      select: { id: true, meetingId: true, title: true },
    });
    return rows.map((row) => ({
      type: 'meetingActionItem' as const,
      id: row.id,
      meetingId: row.meetingId,
      title: row.title,
    }));
  }

  private async searchSongCategories(
    query: string,
    limit: number,
  ): Promise<SongCategorySearchResult[]> {
    const rows = await this.prisma.songCategory.findMany({
      where: { active: true, name: { contains: query } },
      take: limit,
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return rows.map((row) => ({
      type: 'songCategory' as const,
      id: row.id,
      name: row.name,
    }));
  }

  private async searchWelfareAssistance(
    query: string,
    limit: number,
  ): Promise<WelfareAssistanceSearchResult[]> {
    const rows = await this.prisma.welfareAssistance.findMany({
      where: { description: { contains: query } },
      take: limit,
      orderBy: { deliveredAt: 'desc' },
      select: { id: true, caseId: true, description: true },
    });
    return rows.map((row) => ({
      type: 'welfareAssistance' as const,
      id: row.id,
      caseId: row.caseId,
      description: row.description,
    }));
  }

  private async searchRehearsals(
    ctx: OperationalScopeContext,
    query: string,
    limit: number,
  ): Promise<RehearsalSearchResult[]> {
    const rows = await this.prisma.event.findMany({
      where: {
        AND: [
          this.buildEventWhere(ctx, query),
          { type: 'REHEARSAL' },
        ],
      },
      take: limit,
      orderBy: { startTime: 'asc' },
      select: { id: true, title: true },
    });
    return rows.map((row) => ({
      type: 'rehearsal' as const,
      id: row.id,
      eventId: row.id,
      title: row.title,
    }));
  }
}
