import type { FamilyMemberRole } from '@prisma/client';

export interface FamilyMembershipContext {
  familyId: string;
  role: FamilyMemberRole;
  delegationEnabled: boolean;
}

export interface ContributionActorContext {
  userId: string;
  memberId?: string;
  roles: string[];
  permissions: string[];
  familyMemberships: FamilyMembershipContext[];
}

export type ContributionActorRoleSnapshot =
  | 'FAMILY_HEAD'
  | 'FAMILY_ASSISTANT_HEAD'
  | 'CHOIR_PRESIDENT'
  | 'CHOIR_VICE_PRESIDENT'
  | 'CHOIR_TREASURER'
  | 'CHOIR_FAMILY_COORDINATOR'
  | 'CUSTOM_ADJUSTER'
  | 'UNKNOWN';
