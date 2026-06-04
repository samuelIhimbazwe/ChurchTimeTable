"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function useFamilyIdParam(setFamilyId: (id: string) => void) {
  const searchParams = useSearchParams();
  const paramId = searchParams.get("familyId");

  useEffect(() => {
    if (paramId) {
      setFamilyId(paramId);
    }
  }, [paramId, setFamilyId]);

  return paramId;
}
