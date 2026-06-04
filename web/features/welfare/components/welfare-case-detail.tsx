"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsTabs } from "@/components/ui/cmms-tabs";
import {
  fetchWelfareCase,
  fetchWelfareCaseAudit,
  fetchWelfareCaseTimeline,
  getApiErrorMessage,
  http,
  reviewWelfareCase,
  submitWelfareContribution,
  transitionWelfareCase,
  welfareCasesCsvUrl,
  welfareCasesPdfUrl,
} from "@/core/api/http";
import { canManageWelfare } from "@/core/auth/governance-permissions";
import { useSessionStore } from "@/core/auth/session-store";
import { Link } from "@/i18n/routing";

export function WelfareCaseDetail({ caseId }: Readonly<{ caseId: string }>) {
  const t = useTranslations("welfare");
  const profile = useSessionStore((s) => s.profile);
  const canManage = canManageWelfare(profile?.permissions ?? []);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [reviewNotes, setReviewNotes] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const caseQuery = useQuery({
    queryKey: ["welfare", "case", caseId],
    queryFn: () => fetchWelfareCase(caseId),
  });

  const timelineQuery = useQuery({
    queryKey: ["welfare", "case", caseId, "timeline"],
    queryFn: () => fetchWelfareCaseTimeline(caseId),
  });

  const auditQuery = useQuery({
    queryKey: ["welfare", "case", caseId, "audit"],
    queryFn: () => fetchWelfareCaseAudit(caseId),
    enabled: tab === "audit",
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["welfare"] });
  };

  const reviewMutation = useMutation({
    mutationFn: (action: "approve" | "reject" | "request_clarification" | "review") =>
      reviewWelfareCase(caseId, { action, notes: reviewNotes || undefined }),
    onSuccess: invalidate,
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const transitionMutation = useMutation({
    mutationFn: (action: "submit" | "start_fundraising" | "complete" | "close") =>
      transitionWelfareCase(caseId, { action, notes: reviewNotes || undefined }),
    onSuccess: invalidate,
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const contributeMutation = useMutation({
    mutationFn: () =>
      submitWelfareContribution({
        caseId,
        amount: Number(contributionAmount),
      }),
    onSuccess: async () => {
      setContributionAmount("");
      await invalidate();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const data = caseQuery.data;
  const target = data?.approvedAmount ?? data?.requestedAmount ?? 0;
  const raised = data?.raisedAmount ?? 0;
  const progress =
    target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

  async function downloadReport(path: string, filename: string) {
    const response = await http.get(path, { responseType: "blob" });
    const url = URL.createObjectURL(response.data as Blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabs = [
    { id: "overview", label: t("tabOverview") },
    { id: "contributions", label: t("contributions") },
    { id: "timeline", label: t("timeline") },
    { id: "documents", label: t("tabDocuments") },
    { id: "audit", label: t("tabAudit") },
  ];

  return (
    <OperationalScreen title={data?.title ?? t("loading")} subtitle={t("detailDescription")}>
      <Link href="/dashboard/welfare" className="mb-4 inline-block text-sm text-primary underline">
        {t("backToList")}
      </Link>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <CmmsTabs items={tabs} activeId={tab} onChange={setTab} />

      {tab === "overview" && data ? (
        <div className="mt-4 space-y-4">
          <CmmsCard title={t("fundingProgress")}>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">{t("raised")}</dt>
                <dd>{raised}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("target")}</dt>
                <dd>{target}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("remaining")}</dt>
                <dd>{data.remainingAmount ?? "—"}</dd>
              </div>
            </dl>
          </CmmsCard>
          <CmmsCard title={t("caseOverview")}>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t("category")}</dt>
                <dd>{data.category.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("status")}</dt>
                <dd>{data.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("member")}</dt>
                <dd>
                  {data.member.firstName} {data.member.lastName}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm">{data.description}</p>
          </CmmsCard>
          {canManage ? (
            <Link
              href={`/dashboard/welfare/cases/${caseId}/assistance`}
              className="inline-block text-sm text-primary underline"
            >
              {t("recordAssistanceLink")}
            </Link>
          ) : null}
          {canManage ? (
            <CmmsCard title={t("workflow")}>
              <CmmsFormField label={t("reviewNotes")} htmlFor="reviewNotes">
                <CmmsInput
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </CmmsFormField>
              <div className="mt-3 flex flex-wrap gap-2">
                <CmmsButton variant="secondary" onClick={() => reviewMutation.mutate("approve")}>
                  {t("approve")}
                </CmmsButton>
                <CmmsButton
                  variant="secondary"
                  onClick={() => transitionMutation.mutate("start_fundraising")}
                >
                  {t("startFundraising")}
                </CmmsButton>
                <CmmsButton variant="secondary" onClick={() => transitionMutation.mutate("complete")}>
                  {t("markComplete")}
                </CmmsButton>
                <CmmsButton variant="secondary" onClick={() => transitionMutation.mutate("close")}>
                  {t("closeCase")}
                </CmmsButton>
              </div>
            </CmmsCard>
          ) : null}
        </div>
      ) : null}

      {tab === "contributions" && data ? (
        <CmmsCard title={t("contribute")} className="mt-4">
          <ul className="mb-4 space-y-2 text-sm">
            {data.contributions.map((row) => (
              <li key={row.id} className="flex justify-between">
                <span>
                  {row.isAnonymous
                    ? t("anonymous")
                    : row.contributor
                      ? `${row.contributor.firstName} ${row.contributor.lastName}`
                      : t("member")}
                </span>
                <span>{row.amount}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end gap-3">
            <CmmsFormField label={t("amount")} htmlFor="amount">
              <CmmsInput
                id="amount"
                type="number"
                min={1}
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
            </CmmsFormField>
            <CmmsButton
              disabled={contributeMutation.isPending || !contributionAmount}
              onClick={() => contributeMutation.mutate()}
            >
              {t("submitContribution")}
            </CmmsButton>
          </div>
        </CmmsCard>
      ) : null}

      {tab === "timeline" ? (
        <CmmsCard title={t("timeline")} className="mt-4">
          <ul className="space-y-2 text-sm">
            {(timelineQuery.data ?? []).map((event, index) => (
              <li key={`${event.type}-${index}`}>
                <p className="font-medium">{event.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </CmmsCard>
      ) : null}

      {tab === "documents" && data ? (
        <CmmsCard title={t("tabDocuments")} className="mt-4">
          <ul className="space-y-2 text-sm">
            {(data.documentUrls ?? []).map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </CmmsCard>
      ) : null}

      {tab === "audit" ? (
        <CmmsCard title={t("tabAudit")} className="mt-4">
          <ul className="space-y-2 text-sm">
            {(auditQuery.data ?? []).map((entry) => (
              <li key={entry.id}>
                <p className="font-medium">{entry.action}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.actor} · {new Date(entry.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </CmmsCard>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <CmmsButton
          variant="secondary"
          onClick={() => void downloadReport(welfareCasesCsvUrl(), "welfare-cases.csv")}
        >
          {t("exportCsv")}
        </CmmsButton>
        <CmmsButton
          variant="secondary"
          onClick={() => void downloadReport(welfareCasesPdfUrl(), "welfare-cases.pdf")}
        >
          {t("exportPdf")}
        </CmmsButton>
      </div>
    </OperationalScreen>
  );
}
