"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import {
  createWelfareCase,
  fetchWelfareCategories,
  getApiErrorMessage,
} from "@/core/api/http";

const STEPS = [
  "caseInfo",
  "beneficiary",
  "financial",
  "documents",
  "review",
  "submit",
] as const;

export function WelfareCreateWizard() {
  const t = useTranslations("welfare");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    memberId: "",
    requestedAmount: "",
    targetDate: "",
    documentUrls: "",
  });

  const categoriesQuery = useQuery({
    queryKey: ["welfare", "categories"],
    queryFn: fetchWelfareCategories,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createWelfareCase({
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        memberId: form.memberId.trim(),
        requestedAmount: Number(form.requestedAmount),
        targetDate: form.targetDate || undefined,
        documentUrls: form.documentUrls
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      }),
    onSuccess: (created) => {
      router.push(`/dashboard/welfare/${created.id}`);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  function validateStep(): string | null {
    if (step === 0 && !form.title.trim()) return t("validationTitle");
    if (step === 1) {
      if (!form.categoryId) return t("validationCategory");
      if (!form.memberId.trim()) return t("validationMember");
    }
    if (step === 2) {
      const amount = Number(form.requestedAmount);
      if (!amount || amount <= 0) return t("validationAmount");
    }
    return null;
  }

  function next() {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    createMutation.mutate();
  }

  const stepKey = STEPS[step];

  return (
    <OperationalScreen title={t("createCase")} subtitle={t("createCaseHint")}>
      <p className="text-sm text-muted-foreground">
        {t("step")} {step + 1} / {STEPS.length}: {t(`steps.${stepKey}`)}
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <CmmsCard>
        {stepKey === "caseInfo" ? (
          <>
            <CmmsFormField label={t("fields.title")} htmlFor="title">
              <CmmsInput
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </CmmsFormField>
            <CmmsFormField label={t("fields.description")} htmlFor="description">
              <CmmsInput
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </CmmsFormField>
          </>
        ) : null}

        {stepKey === "beneficiary" ? (
          <>
            <CmmsFormField label={t("fields.category")} htmlFor="categoryId">
              <select
                id="categoryId"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              >
                <option value="">{t("selectCategory")}</option>
                {(categoriesQuery.data ?? []).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </CmmsFormField>
            <CmmsFormField label={t("fields.memberId")} htmlFor="memberId">
              <CmmsInput
                id="memberId"
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              />
            </CmmsFormField>
          </>
        ) : null}

        {stepKey === "financial" ? (
          <>
            <CmmsFormField label={t("fields.requestedAmount")} htmlFor="amount">
              <CmmsInput
                id="amount"
                type="number"
                min={1}
                value={form.requestedAmount}
                onChange={(e) =>
                  setForm({ ...form, requestedAmount: e.target.value })
                }
              />
            </CmmsFormField>
            <CmmsFormField label={t("targetDate")} htmlFor="targetDate">
              <CmmsInput
                id="targetDate"
                type="date"
                value={form.targetDate}
                onChange={(e) =>
                  setForm({ ...form, targetDate: e.target.value })
                }
              />
            </CmmsFormField>
          </>
        ) : null}

        {stepKey === "documents" ? (
          <CmmsFormField label={t("fields.documents")} htmlFor="documents">
            <textarea
              id="documents"
              className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder={t("documentsPlaceholder")}
              value={form.documentUrls}
              onChange={(e) =>
                setForm({ ...form, documentUrls: e.target.value })
              }
            />
          </CmmsFormField>
        ) : null}

        {stepKey === "review" || stepKey === "submit" ? (
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("fields.title")}</dt>
              <dd>{form.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("fields.memberId")}</dt>
              <dd>{form.memberId}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("fields.requestedAmount")}</dt>
              <dd>{form.requestedAmount}</dd>
            </div>
          </dl>
        ) : null}
      </CmmsCard>

      <div className="mt-4 flex gap-2">
        <CmmsButton
          variant="secondary"
          disabled={step === 0 || createMutation.isPending}
          onClick={() => setStep(Math.max(0, step - 1))}
        >
          {t("back")}
        </CmmsButton>
        <CmmsButton disabled={createMutation.isPending} onClick={next}>
          {step === STEPS.length - 1 ? t("submit") : t("next")}
        </CmmsButton>
      </div>
    </OperationalScreen>
  );
}
