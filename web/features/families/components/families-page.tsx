"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import {
  addFamilyMember,
  createFamily,
  deleteFamily,
  fetchFamilies,
  fetchFamily,
  fetchFamilyMetrics,
  getApiErrorMessage,
  removeFamilyMember,
  updateFamily,
} from "@/core/api/http";
import { canManageFamilies } from "@/core/auth/governance-permissions";
import { useSessionStore } from "@/core/auth/session-store";
import { FamilyList } from "@/features/families/components/family-list";
import { FamilyDetailPanel } from "@/features/families/components/family-detail";
import { FamilyForm } from "@/features/families/components/family-form";

type Mode = "list" | "create" | "edit";

export function FamiliesPage() {
  const t = useTranslations("families");
  const profile = useSessionStore((s) => s.profile);
  const canManage = canManageFamilies(profile?.permissions ?? []);
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("list");
  const [error, setError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["families", "with-metrics"],
    queryFn: () => fetchFamilies({ includeMetrics: true }),
  });

  const detailQuery = useQuery({
    queryKey: ["families", selectedId],
    queryFn: () => fetchFamily(selectedId!),
    enabled: !!selectedId && mode === "list",
  });

  const metricsQuery = useQuery({
    queryKey: ["families", selectedId, "metrics"],
    queryFn: () => fetchFamilyMetrics(selectedId!),
    enabled: !!selectedId && mode === "list",
  });

  const selectedSummary = useMemo(
    () => listQuery.data?.items.find((item) => item.id === selectedId) ?? null,
    [listQuery.data?.items, selectedId],
  );

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["families"] });
    if (selectedId) {
      await queryClient.invalidateQueries({ queryKey: ["families", selectedId] });
    }
  };

  const createMutation = useMutation({
    mutationFn: createFamily,
    onSuccess: async (family) => {
      setSelectedId(family.id);
      setMode("list");
      await invalidate();
    },
    onError: (err) => setError(getApiErrorMessage(err, t("saveFailed"))),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateFamily>[1];
    }) => updateFamily(id, input),
    onSuccess: async () => {
      setMode("list");
      await invalidate();
    },
    onError: (err) => setError(getApiErrorMessage(err, t("saveFailed"))),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFamily,
    onSuccess: async () => {
      setSelectedId(null);
      await invalidate();
    },
    onError: (err) => setError(getApiErrorMessage(err, t("deleteFailed"))),
  });

  const memberMutation = useMutation({
    mutationFn: async ({
      action,
      familyId,
      memberId,
      role,
    }: {
      action: "add" | "remove" | "head";
      familyId: string;
      memberId: string;
      role?: string;
    }) => {
      if (action === "add") return addFamilyMember(familyId, { memberId, role });
      if (action === "remove") return removeFamilyMember(familyId, memberId);
      return updateFamily(familyId, { headMemberId: memberId });
    },
    onSuccess: invalidate,
    onError: (err) => setError(getApiErrorMessage(err, t("memberActionFailed"))),
  });

  if (listQuery.isLoading) {
    return <DashboardStateCard title={t("title")} message={t("loading")} />;
  }

  if (listQuery.isError || !listQuery.data) {
    return <DashboardStateCard title={t("title")} message={t("loadError")} />;
  }

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    memberMutation.isPending;

  return (
    <OperationalScreen error={error} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">{t("title")}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{t("subtitle")}</p>
      </div>

      {mode === "create" ? (
        <FamilyForm
          submitting={createMutation.isPending}
          onCancel={() => setMode("list")}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      ) : null}

      {mode === "edit" && detailQuery.data ? (
        <FamilyForm
          initial={{
            familyName: detailQuery.data.familyName,
            notes: detailQuery.data.notes ?? undefined,
            headMemberId: detailQuery.data.headMember?.id,
          }}
          submitting={updateMutation.isPending}
          onCancel={() => setMode("list")}
          onSubmit={(values) =>
            updateMutation.mutate({
              id: detailQuery.data!.id,
              input: values,
            })
          }
        />
      ) : null}

      {mode === "list" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <FamilyList
            families={listQuery.data.items}
            selectedId={selectedId}
            canManage={canManage}
            onCreate={() => setMode("create")}
            onSelect={setSelectedId}
          />
          {selectedId && detailQuery.data ? (
            <FamilyDetailPanel
              family={detailQuery.data}
              metrics={metricsQuery.data}
              metricsLoading={metricsQuery.isLoading}
              canManage={canManage}
              busy={busy}
              onEdit={() => setMode("edit")}
              onDelete={() => {
                if (window.confirm(t("deleteConfirm"))) {
                  deleteMutation.mutate(selectedId);
                }
              }}
              onAddMember={(memberId, role) =>
                memberMutation.mutateAsync({
                  action: "add",
                  familyId: selectedId,
                  memberId,
                  role,
                })
              }
              onRemoveMember={(memberId) =>
                memberMutation.mutateAsync({
                  action: "remove",
                  familyId: selectedId,
                  memberId,
                })
              }
              onSetHead={(memberId) =>
                memberMutation.mutateAsync({
                  action: "head",
                  familyId: selectedId,
                  memberId,
                })
              }
            />
          ) : selectedSummary ? (
            <DashboardStateCard title={selectedSummary.familyName} message={t("loadingDetail")} />
          ) : (
            <DashboardStateCard title={t("selectFamilyTitle")} message={t("selectFamilyHint")} />
          )}
        </div>
      ) : null}
    </OperationalScreen>
  );
}
