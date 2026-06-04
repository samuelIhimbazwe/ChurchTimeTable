"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import {
  fetchChurchSetup,
  fetchChurchSetupStatus,
  getApiErrorMessage,
  saveChurchSetupStep,
} from "@/core/api/http";

type StepForm = {
  churchName: string;
  churchCity: string;
  churchCountry: string;
  leadershipNotes: string;
  enabledMinistries: string;
  disabledMinistries: string;
  customMinistries: string;
  choirsJson: string;
  protocolRules: string;
  servicesJson: string;
};

const emptyForm = (): StepForm => ({
  churchName: "",
  churchCity: "",
  churchCountry: "",
  leadershipNotes: "",
  enabledMinistries: "CHOIR,PROTOCOL,WELFARE",
  disabledMinistries: "",
  customMinistries: "",
  choirsJson: JSON.stringify(
    [
      { code: "main", name: "Main choir", choirKind: "PRIMARY" },
      { code: "youth", name: "Youth choir", choirKind: "YOUTH" },
    ],
    null,
    2,
  ),
  protocolRules: JSON.stringify({ maxTeamSize: 12, backupEnabled: true }, null, 2),
  servicesJson: JSON.stringify(
    [
      { code: "sunday_main", name: "Sunday main service", dayOfWeek: 0 },
      { code: "midweek", name: "Midweek service", dayOfWeek: 3 },
    ],
    null,
    2,
  ),
});

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function ChurchSetupWizard() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<StepForm>(emptyForm);

  const setupQuery = useQuery({
    queryKey: ["church-setup"],
    queryFn: fetchChurchSetup,
  });

  const statusQuery = useQuery({
    queryKey: ["church-setup-status"],
    queryFn: fetchChurchSetupStatus,
  });

  const steps = setupQuery.data?.steps ?? [];
  const readiness = setupQuery.data?.readiness as Record<string, unknown> | undefined;
  const level = readiness?.level as string | undefined;

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = buildStepPayload(step, form);
      return saveChurchSetupStep(step, data);
    },
    onSuccess: (result) => {
      setError(null);
      queryClient.setQueryData(["church-setup"], result);
      void queryClient.invalidateQueries({ queryKey: ["church-setup-status"] });
      if (step < 7) {
        setStep(step + 1);
      }
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const currentTitle = useMemo(
    () => steps.find((s) => s.step === step)?.title ?? `Step ${step}`,
    [steps, step],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
          Church setup
        </p>
        <h1 className="text-2xl font-semibold">Deployment setup wizard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Step {step} of 7 — {currentTitle}
        </p>
        {level ? (
          <p className="mt-2 text-sm">
            Readiness: <span className="font-medium">{level}</span>
            {statusQuery.data?.setupCompleted ? " · Setup marked complete" : null}
          </p>
        ) : null}
      </header>

      <CmmsCard>
        {step === 1 ? (
          <div className="space-y-4">
            <CmmsFormField label="Church name">
              <CmmsInput
                value={form.churchName}
                onChange={(e) => setForm({ ...form, churchName: e.target.value })}
              />
            </CmmsFormField>
            <CmmsFormField label="City">
              <CmmsInput
                value={form.churchCity}
                onChange={(e) => setForm({ ...form, churchCity: e.target.value })}
              />
            </CmmsFormField>
            <CmmsFormField label="Country">
              <CmmsInput
                value={form.churchCountry}
                onChange={(e) => setForm({ ...form, churchCountry: e.target.value })}
              />
            </CmmsFormField>
          </div>
        ) : null}

        {step === 2 ? (
          <CmmsFormField label="Leadership notes (stored in configuration)">
            <textarea
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              rows={6}
              value={form.leadershipNotes}
              onChange={(e) => setForm({ ...form, leadershipNotes: e.target.value })}
            />
          </CmmsFormField>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <CmmsFormField label="Enabled ministry codes (comma-separated)">
              <CmmsInput
                value={form.enabledMinistries}
                onChange={(e) => setForm({ ...form, enabledMinistries: e.target.value })}
              />
            </CmmsFormField>
            <CmmsFormField label="Disabled ministry codes">
              <CmmsInput
                value={form.disabledMinistries}
                onChange={(e) => setForm({ ...form, disabledMinistries: e.target.value })}
              />
            </CmmsFormField>
            <CmmsFormField label="Custom ministries JSON array">
              <textarea
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                rows={4}
                value={form.customMinistries}
                onChange={(e) => setForm({ ...form, customMinistries: e.target.value })}
                placeholder='[{"code":"media","name":"Media ministry"}]'
              />
            </CmmsFormField>
          </div>
        ) : null}

        {step === 4 ? (
          <CmmsFormField label="Choirs JSON">
            <textarea
              className="border-input bg-background w-full rounded-md border px-3 py-2 font-mono text-sm"
              rows={8}
              value={form.choirsJson}
              onChange={(e) => setForm({ ...form, choirsJson: e.target.value })}
            />
          </CmmsFormField>
        ) : null}

        {step === 5 ? (
          <CmmsFormField label="Protocol rules JSON">
            <textarea
              className="border-input bg-background w-full rounded-md border px-3 py-2 font-mono text-sm"
              rows={8}
              value={form.protocolRules}
              onChange={(e) => setForm({ ...form, protocolRules: e.target.value })}
            />
          </CmmsFormField>
        ) : null}

        {step === 6 ? (
          <CmmsFormField label="Service templates JSON">
            <textarea
              className="border-input bg-background w-full rounded-md border px-3 py-2 font-mono text-sm"
              rows={8}
              value={form.servicesJson}
              onChange={(e) => setForm({ ...form, servicesJson: e.target.value })}
            />
          </CmmsFormField>
        ) : null}

        {step === 7 ? (
          <div className="space-y-3 text-sm">
            <p>Review your entries, then finish setup. This marks deployment configuration as complete.</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1">
              <li>Church: {form.churchName || "(not set)"}</li>
              <li>Ministries enabled: {form.enabledMinistries}</li>
              <li>Choirs and services configured via JSON in prior steps</li>
            </ul>
          </div>
        ) : null}

        {error ? <p className="text-destructive mt-4 text-sm">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <CmmsButton
            variant="secondary"
            disabled={step <= 1 || saveMutation.isPending}
            onClick={() => setStep(Math.max(1, step - 1))}
          >
            Back
          </CmmsButton>
          <CmmsButton
            disabled={saveMutation.isPending || setupQuery.isLoading}
            onClick={() => saveMutation.mutate()}
          >
            {step === 7 ? "Complete setup" : "Save and continue"}
          </CmmsButton>
        </div>
      </CmmsCard>

      <Link href="/dashboard/admin/deployment" className="text-primary text-sm underline">
        Back to deployment center
      </Link>
    </div>
  );
}

function buildStepPayload(step: number, form: StepForm): Record<string, unknown> {
  switch (step) {
    case 1:
      return {
        name: form.churchName,
        city: form.churchCity,
        country: form.churchCountry,
      };
    case 2:
      return { notes: form.leadershipNotes };
    case 3:
      return {
        enabled: form.enabledMinistries
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        disabled: form.disabledMinistries
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        custom: parseJson(form.customMinistries || "[]", []),
      };
    case 4:
      return { choirs: parseJson(form.choirsJson, []) };
    case 5:
      return { rules: parseJson(form.protocolRules, {}) };
    case 6:
      return { services: parseJson(form.servicesJson, []) };
    case 7:
      return { confirmed: true };
    default:
      return {};
  }
}
