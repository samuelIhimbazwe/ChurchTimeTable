/** Membership claims awaiting president / admin review. */
export const PROTOCOL_CLAIM_REVIEW_STALE_HOURS = 48;

/** Replacement requests before service day. */
export const PROTOCOL_REPLACEMENT_REVIEW_STALE_HOURS = 24;

/** Draft teams not yet published before occurrence. */
export const PROTOCOL_TEAM_PUBLISH_STALE_HOURS = 48;

export { hoursSince, isStaleHours } from '../common/governance/officer-sla.util';
