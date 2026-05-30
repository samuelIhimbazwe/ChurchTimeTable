"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsSkeleton } from "@/components/ui/cmms-skeleton";
import { getApiErrorMessage } from "@/core/api/errors";
import {
  fetchAttendanceScoringWeights,
  updateAttendanceScoringWeights,
} from "@/core/api/http";
import type { AttendanceOperationalStatus } from "@/core/api/types";

const WEIGHT_KEYS: AttendanceOperationalStatus[] = [
  "ATTENDED",
  "LATE",
  "EXCUSED_ABSENCE",
  "UNEXCUSED_ABSENCE",
  "REPLACEMENT_SERVED",
  "VOLUNTARY_EXTRA_SERVICE",
];

export function AttendanceWeightsPanel() {
  const t = useTranslations("attendance");
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const weightsQuery = useQuery({
    queryKey: ["attendance", "scoring-weights"],
    queryFn: fetchAttendanceScoringWeights,
  });

  useEffect(() => {
    if (weightsQuery.data) {
      setValues(
        Object.fromEntries(
          WEIGHT_KEYS.map((key) => [key, String(weightsQuery.data?.[key] ?? "")]),
        ),
      );
    }
  }, [weightsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const weights = Object.fromEntries(
        WEIGHT_KEYS.map((key) => [key, Number(values[key] ?? 0)]),
      );
      return updateAttendanceScoringWeights(weights);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "scoring-weights"] });
      setError(null);
      setSaved(true);
    },
    onError: (saveError) => {
      setSaved(false);
      setError(getApiErrorMessage(saveError, t("weights.saveFailed")));
    },
  });

  if (weightsQuery.isLoading) {
    return (
      <CmmsCard title={t("weights.title")} description={t("weights.subtitle")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WEIGHT_KEYS.map((key) => (
            <CmmsSkeleton key={key} className="h-11" />
          ))}
        </div>
      </CmmsCard>
    );
  }

  return (
    <CmmsCard title={t("weights.title")} description={t("weights.subtitle")}>
      <div className="cmms-section-stack">
        {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}
        {saved ? <CmmsAlert variant="success">{t("weights.saved")}</CmmsAlert> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WEIGHT_KEYS.map((key) => (
            <CmmsFormField key={key} label={t(`status.${key}`)}>
              <CmmsInput
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={values[key] ?? ""}
                onChange={(event) => {
                  setSaved(false);
                  setValues((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }));
                }}
              />
            </CmmsFormField>
          ))}
        </div>
        <CmmsButton
          variant="primary"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? t("weights.saving") : t("weights.save")}
        </CmmsButton>
      </div>
    </CmmsCard>
  );
}
