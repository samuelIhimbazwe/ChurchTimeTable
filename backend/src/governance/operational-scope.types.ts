export interface OperationalScopeContext {
  actorUserId: string;
  memberId?: string;
  permissions: string[];
  ministryIds: string[];
  protocolMinistryIds: string[];
  choirScopeIds: string[];
  teamIds: string[];
  scopedMemberIds: string[];
  canProtocolOversight: boolean;
  canProtocolCoordinate: boolean;
  canProtocolTeamHead: boolean;
  canChoirOperations: boolean;
}
