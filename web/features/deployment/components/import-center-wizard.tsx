"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import {
  confirmImportJob,
  fetchImportJob,
  fetchImportJobs,
  getApiErrorMessage,
  uploadImportPreview,
  type ImportConflictStrategy,
  type ImportJobType,
} from "@/core/api/http";
import { ImportHistoryPanel } from "./import-history-panel";

const IMPORT_TYPES: { value: ImportJobType; label: string }[] = [
  { value: "MEMBERS", label: "Members" },
  { value: "CHOIR_MEMBERS", label: "Choir members" },
  { value: "PROTOCOL_MEMBERS", label: "Protocol members" },
  { value: "MINISTRIES", label: "Ministries" },
  { value: "MINISTRY_MEMBERS", label: "Ministry members" },
  { value: "LEADERSHIP_ASSIGNMENTS", label: "Leadership assignments" },
  { value: "ASSETS", label: "Assets" },
  { value: "SCHEDULES", label: "Schedules" },
];

const STRATEGIES: { value: ImportConflictStrategy; label: string }[] = [
  { value: "SKIP", label: "Skip duplicates" },
  { value: "REPLACE", label: "Replace existing" },
  { value: "MERGE", label: "Merge" },
  { value: "MANUAL_REVIEW", label: "Manual review (block if conflicts)" },
];

type ImportPreview = {
  validRows: unknown[];
  invalidRows: Array<{ row: number; errors: string[] }>;
  duplicateRows: Array<{ row: number; reason: string }>;
  conflictRows: Array<{ row: number; reason: string }>;
  warningRows: Array<{ row: number; warning: string }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    conflicts: number;
    warnings: number;
  };
};

export function ImportCenterWizard() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [importType, setImportType] = useState<ImportJobType>("MEMBERS");
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<ImportConflictStrategy>("SKIP");
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const historyQuery = useQuery({
    queryKey: ["import-jobs"],
    queryFn: fetchImportJobs,
    enabled: showHistory,
  });

  const jobQuery = useQuery({
    queryKey: ["import-job", jobId],
    queryFn: () => fetchImportJob(jobId!),
    enabled: !!jobId && step >= 3,
  });

  const preview = jobQuery.data?.preview as ImportPreview | undefined;
  const results = jobQuery.data?.results as Record<string, unknown> | undefined;

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Choose a file");
      return uploadImportPreview(importType, file);
    },
    onSuccess: (job) => {
      setError(null);
      setJobId(job.id as string);
      setStep(3);
      void queryClient.invalidateQueries({ queryKey: ["import-jobs"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!jobId) throw new Error("No import job");
      return confirmImportJob(jobId, strategy);
    },
    onSuccess: () => {
      setError(null);
      setStep(5);
      void queryClient.invalidateQueries({ queryKey: ["import-job", jobId] });
      void queryClient.invalidateQueries({ queryKey: ["import-jobs"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return "Choose import type";
      case 2:
        return "Upload file";
      case 3:
        return "Preview results";
      case 4:
        return "Conflict strategy";
      case 5:
        return "Import report";
      default:
        return "";
    }
  }, [step]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            Import center
          </p>
          <h1 className="text-2xl font-semibold">Data import wizard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Step {step} of 5 — {stepTitle}
          </p>
        </div>
        <CmmsButton variant="secondary" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? "Hide history" : "Import history"}
        </CmmsButton>
      </header>

      {showHistory ? (
        <ImportHistoryPanel
          jobs={(historyQuery.data ?? []) as Array<Record<string, unknown>>}
          loading={historyQuery.isLoading}
        />
      ) : null}

      <CmmsCard>
        {step === 1 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {IMPORT_TYPES.map((t) => (
              <label
                key={t.value}
                className={`cursor-pointer rounded-md border p-3 text-sm ${
                  importType === t.value ? "border-[var(--primary)] bg-muted/40" : ""
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={importType === t.value}
                  onChange={() => setImportType(t.value)}
                />
                {t.label}
              </label>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <CmmsFormField label="CSV or XLSX file">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              Type: {IMPORT_TYPES.find((t) => t.value === importType)?.label}
            </p>
          </CmmsFormField>
        ) : null}

        {step === 3 && preview ? (
          <PreviewPanel preview={preview} />
        ) : step === 3 ? (
          <p className="text-muted-foreground text-sm">Loading preview…</p>
        ) : null}

        {step === 4 ? (
          <div className="space-y-2">
            {STRATEGIES.map((s) => (
              <label key={s.value} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={strategy === s.value}
                  onChange={() => setStrategy(s.value)}
                />
                {s.label}
              </label>
            ))}
          </div>
        ) : null}

        {step === 5 ? (
          <ReportPanel results={results} job={jobQuery.data as Record<string, unknown>} />
        ) : null}

        {error ? <p className="text-destructive mt-4 text-sm">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {step > 1 && step < 5 ? (
            <CmmsButton variant="secondary" onClick={() => setStep(step - 1)}>
              Back
            </CmmsButton>
          ) : null}
          {step === 1 ? (
            <CmmsButton onClick={() => setStep(2)}>Continue</CmmsButton>
          ) : null}
          {step === 2 ? (
            <CmmsButton
              disabled={!file || uploadMutation.isPending}
              onClick={() => uploadMutation.mutate()}
            >
              Upload and preview
            </CmmsButton>
          ) : null}
          {step === 3 ? (
            <CmmsButton onClick={() => setStep(4)}>Continue</CmmsButton>
          ) : null}
          {step === 4 ? (
            <CmmsButton
              disabled={confirmMutation.isPending}
              onClick={() => confirmMutation.mutate()}
            >
              Confirm import
            </CmmsButton>
          ) : null}
          {step === 5 ? (
            <CmmsButton
              onClick={() => {
                setStep(1);
                setFile(null);
                setJobId(null);
              }}
            >
              Start another import
            </CmmsButton>
          ) : null}
        </div>
      </CmmsCard>

      <Link href="/dashboard/admin/deployment" className="text-primary text-sm underline">
        Back to deployment center
      </Link>
    </div>
  );
}

function PreviewPanel({ preview }: { preview: ImportPreview }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(
          [
            ["Valid", preview.summary.valid],
            ["Invalid", preview.summary.invalid],
            ["Warnings", preview.summary.warnings],
            ["Duplicates", preview.summary.duplicates],
            ["Conflicts", preview.summary.conflicts],
            ["Total", preview.summary.total],
          ] as const
        ).map(([label, count]) => (
          <div key={label} className="rounded border p-2 text-center">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="text-lg font-semibold">{count}</p>
          </div>
        ))}
      </div>
      {preview.invalidRows.length > 0 ? (
        <section>
          <h3 className="font-medium">Invalid rows</h3>
          <ul className="text-muted-foreground mt-1 max-h-40 overflow-auto text-xs">
            {preview.invalidRows.slice(0, 20).map((r) => (
              <li key={r.row}>
                Row {r.row}: {r.errors.join("; ")}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {preview.conflictRows.length > 0 ? (
        <section>
          <h3 className="font-medium">Conflicts</h3>
          <ul className="text-muted-foreground mt-1 max-h-32 overflow-auto text-xs">
            {preview.conflictRows.slice(0, 15).map((r) => (
              <li key={r.row}>
                Row {r.row}: {r.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ReportPanel({
  results,
  job,
}: {
  results?: Record<string, unknown>;
  job?: Record<string, unknown>;
}) {
  if (!results && !job) {
    return <p className="text-sm">No report available.</p>;
  }
  const applied = (results?.appliedCount as number) ?? 0;
  const failed = (results?.failedCount as number) ?? 0;
  const skipped = (results?.skippedCount as number) ?? 0;
  return (
    <div className="space-y-3 text-sm">
      <p>
        Status: <strong>{String(job?.status ?? "COMPLETED")}</strong>
      </p>
      <p>
        Applied: {applied} · Failed: {failed} · Skipped: {skipped}
      </p>
      <p className="text-muted-foreground">
        Strategy: {String(results?.conflictStrategy ?? "—")}
      </p>
    </div>
  );
}
