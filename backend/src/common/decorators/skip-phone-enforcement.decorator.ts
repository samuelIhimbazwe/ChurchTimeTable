import { SetMetadata } from '@nestjs/common';

export const SKIP_PHONE_ENFORCEMENT_KEY = 'skipPhoneEnforcement';

export const SkipPhoneEnforcement = () =>
  SetMetadata(SKIP_PHONE_ENFORCEMENT_KEY, true);
