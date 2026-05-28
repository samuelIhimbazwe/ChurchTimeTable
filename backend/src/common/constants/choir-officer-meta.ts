import { ROLES } from './roles';

/** Human titles for choir officer roles (seed descriptions + docs). */
export const CHOIR_OFFICER_META: Record<
  string,
  { titleRw: string; titleEn: string; titleFr: string }
> = {
  [ROLES.CHOIR_PRESIDENT]: {
    titleRw: 'Perezida wa Korali',
    titleEn: 'Choir President',
    titleFr: 'Président de la chorale',
  },
  [ROLES.CHOIR_VICE_PRESIDENT]: {
    titleRw: 'Perezida ushinzwe',
    titleEn: 'Vice President',
    titleFr: 'Vice-président',
  },
  [ROLES.CHOIR_SECRETARY]: {
    titleRw: 'Umunyamabanga wa Korali',
    titleEn: 'Choir Secretary',
    titleFr: 'Secrétaire de la chorale',
  },
  [ROLES.CHOIR_TREASURER]: {
    titleRw: 'Umubitsi wa Korali',
    titleEn: 'Choir Treasurer',
    titleFr: 'Trésorier de la chorale',
  },
  [ROLES.CHOIR_REHEARSAL_DIRECTOR]: {
    titleRw: "Umuyobozi w'imyitozo / amajwi",
    titleEn: 'Rehearsal Director',
    titleFr: 'Chef des répétitions',
  },
  [ROLES.CHOIR_LOGISTICS]: {
    titleRw: "Umuyobozi w'ibikoresho",
    titleEn: 'Logistics / Equipment',
    titleFr: 'Logistique / équipement',
  },
  [ROLES.CHOIR_COMMITTEE]: {
    titleRw: 'Inteko ishinzwe Korali',
    titleEn: 'Choir Committee',
    titleFr: 'Comité de la chorale',
  },
  [ROLES.CHOIR_LEADER]: {
    titleRw: "Umuyobozi wa Korali (his)",
    titleEn: 'Choir Leader (legacy)',
    titleFr: 'Responsable chorale (ancien)',
  },
};

export function roleDescription(roleName: string): string {
  const m = CHOIR_OFFICER_META[roleName];
  if (!m) return roleName;
  return `${m.titleRw} · ${m.titleEn}`;
}
