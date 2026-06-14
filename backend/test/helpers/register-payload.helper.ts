export function buildRegisterPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const stamp = Date.now() + Math.floor(Math.random() * 1000);
  const phoneSuffix = String(stamp).slice(-7).padStart(7, '0');
  return {
    email: `reg-${stamp}@test.local`,
    password: 'TestPass1',
    firstName: 'Test',
    lastName: 'User',
    phone: `078${phoneSuffix}`,
    nationalId: `1${String(stamp).padStart(15, '0').slice(-15)}`,
    acceptedTerms: true,
    preferredLanguage: 'en',
    ...overrides,
  };
}
