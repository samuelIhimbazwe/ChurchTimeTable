/** Sprint 10 v1.3 — deterministic ranking tie-breakers. */

export function compareFamilyRank(
  a: { effectiveTotal: number; familyCode: string | null },
  b: { effectiveTotal: number; familyCode: string | null },
): number {
  if (b.effectiveTotal !== a.effectiveTotal) {
    return b.effectiveTotal - a.effectiveTotal;
  }
  return (a.familyCode ?? '').localeCompare(b.familyCode ?? '');
}

export function compareMemberRank(
  a: { effectiveTotal: number; memberNumber: string | null },
  b: { effectiveTotal: number; memberNumber: string | null },
): number {
  if (b.effectiveTotal !== a.effectiveTotal) {
    return b.effectiveTotal - a.effectiveTotal;
  }
  return (a.memberNumber ?? '').localeCompare(b.memberNumber ?? '');
}
