/** v1 contribution workflow capabilities — do not extend without review. */
export const CHOIR_CONTRIBUTION_CAPABILITY_IDS = [
  'choir.contribution.submit@self',
  'choir.contribution.view@self',
  'choir.contribution.view@family',
  'choir.contribution.approve@family',
  'choir.contribution.verify@choir',
  'choir.contribution.view@choir',
  'choir.contribution.adjust@choir',
  'choir.contribution.adjust@family',
  'choir.contribution.catalog.manage@choir',
  'choir.contribution.oversight@choir',
  'choir.budget.view@choir',
  'choir.budget.manage@choir',
  'choir.budget.close@choir',
] as const;

export type ChoirContributionCapabilityId =
  (typeof CHOIR_CONTRIBUTION_CAPABILITY_IDS)[number];

export function capabilityRequiresScopeId(id: string): boolean {
  return id.endsWith('@family') || id.endsWith('@sponsor');
}

export function parseCapabilityId(id: string): {
  domain: string;
  resource: string;
  action: string;
  scope: string;
} | null {
  const at = id.lastIndexOf('@');
  if (at <= 0) return null;
  const head = id.slice(0, at);
  const scope = id.slice(at + 1);
  const parts = head.split('.');
  if (parts.length < 3) return null;
  const action = parts.pop()!;
  const resource = parts.slice(1).join('.');
  const domain = parts[0]!;
  return { domain, resource, action, scope };
}
