/** Display-only member label helpers — UUIDs remain authoritative for keys/values. */

export function formatMemberDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
}): string {
  return [input.firstName, input.lastName].filter(Boolean).join(" ").trim();
}

export function formatMemberPickerLabel(input: {
  memberNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const name = formatMemberDisplayName(input);
  if (input.memberNumber) {
    return `${input.memberNumber} — ${name}`;
  }
  return name;
}

export function formatMemberDirectoryPrimary(input: {
  memberNumber?: string | null;
}): string | null {
  return input.memberNumber ?? null;
}
