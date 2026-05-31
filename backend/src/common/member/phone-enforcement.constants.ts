export const PHONE_ENFORCEMENT_ENABLED_KEY = 'phone.enforcement.enabled';
export const PHONE_ENFORCEMENT_MODE_KEY = 'phone.enforcement.mode';

export type PhoneEnforcementMode = 'soft' | 'warning' | 'strict';

export const DEFAULT_PHONE_ENFORCEMENT = {
  enabled: false,
  mode: 'soft' as PhoneEnforcementMode,
};

export function parsePhoneEnforcementMode(
  value: unknown,
): PhoneEnforcementMode {
  if (value === 'warning' || value === 'strict' || value === 'soft') {
    return value;
  }
  return 'soft';
}
