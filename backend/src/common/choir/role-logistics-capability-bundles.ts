import { ROLES } from '../constants/roles';

const DOC_VIEW = 'choir.document.view@choir' as const;
const DOC_MANAGE = 'choir.document.manage@choir' as const;
const UNI_VIEW = 'choir.uniform.view@choir' as const;
const UNI_MANAGE = 'choir.uniform.manage@choir' as const;
const EQ_VIEW = 'choir.equipment.view@choir' as const;
const EQ_MANAGE = 'choir.equipment.manage@choir' as const;

const FULL_LOGISTICS = [
  DOC_VIEW,
  DOC_MANAGE,
  UNI_VIEW,
  UNI_MANAGE,
  EQ_VIEW,
  EQ_MANAGE,
] as const;

/** CMMS role name → choir-scoped logistics capabilities. */
export const ROLE_LOGISTICS_CAPABILITY_BUNDLES: Record<
  string,
  readonly string[]
> = {
  [ROLES.CHOIR_ADMIN]: [...FULL_LOGISTICS],
  [ROLES.CHOIR_PRESIDENT]: [...FULL_LOGISTICS],
  [ROLES.CHOIR_LEADER]: [...FULL_LOGISTICS],
  [ROLES.CHOIR_SECRETARY]: [DOC_VIEW, DOC_MANAGE],
  [ROLES.CHOIR_LOGISTICS]: [UNI_VIEW, UNI_MANAGE, EQ_VIEW, EQ_MANAGE],
};
