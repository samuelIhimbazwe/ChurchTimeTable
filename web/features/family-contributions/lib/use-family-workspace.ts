"use client";

import { useMemo, useState } from "react";

import type { FamilyLeadershipContextItem } from "@/features/family-contributions/types";
import { useFamilyContextQuery } from "@/features/family-contributions/hooks/use-family-contribution-queries";

export function useFamilyWorkspace() {
  const contextQuery = useFamilyContextQuery();
  const families = contextQuery.data?.families ?? [];

  const [familyId, setFamilyId] = useState<string | undefined>(undefined);

  const activeFamilyId = useMemo(() => {
    if (familyId && families.some((f) => f.familyId === familyId)) {
      return familyId;
    }
    if (families.length === 1) {
      return families[0].familyId;
    }
    return familyId;
  }, [familyId, families]);

  const activeFamily = useMemo<FamilyLeadershipContextItem | undefined>(
    () => families.find((f) => f.familyId === activeFamilyId),
    [families, activeFamilyId],
  );

  return {
    contextQuery,
    families,
    activeFamilyId,
    activeFamily,
    setFamilyId,
    requiresPicker: contextQuery.data?.requiresFamilyPicker ?? false,
  };
}
