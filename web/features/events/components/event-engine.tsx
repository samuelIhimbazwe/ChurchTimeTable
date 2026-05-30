"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsInput } from "@/components/ui/cmms-input";
import { CmmsModal } from "@/components/ui/cmms-modal";
import { CmmsSelect } from "@/components/ui/cmms-select";
import { CmmsSkeleton } from "@/components/ui/cmms-skeleton";
import { CmmsTable } from "@/components/ui/cmms-table";
import { CmmsTabs } from "@/components/ui/cmms-tabs";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsAlert } from "@/components/ui/cmms-alert";
import { getApiErrorMessage } from "@/core/api/errors";
import type { EventFormInput, EventItem, EventStatus, EventType, MinistryScope } from "@/core/api/types";
import { useEventAssignmentsQuery, useEventsQuery, useCreateEventMutation, useUpdateEventMutation, useCancelEventMutation, useValidateAssignmentMutation, useCreateAssignmentMutation, useBulkAssignMutation, useChoirRotationPoolQuery, useAutoAssignChoirRotationMutation } from "@/features/events/hooks/use-event-engine";

type CalendarView = "month" | "week" | "agenda";

const eventTypeValues: EventType[] = [
  "CHOIR_SERVICE",
  "REHEARSAL",
  "CONCERT",
  "PROTOCOL_SERVICE",
  "CHURCH_EVENT",
];

const ministryValues: MinistryScope[] = ["CHOIR", "PROTOCOL", "BOTH"];
const statusValues: EventStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const recurrencePresets = ["NONE", "WEEKLY", "BIWEEKLY", "MONTHLY"];

export function EventEngine() {
  const t = useTranslations("events");
  const [view, setView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [ministryFilter, setMinistryFilter] = useState<MinistryScope | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<EventType | "ALL">("ALL");
  const [editorOpen, setEditorOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const monthRange = getMonthRange(selectedDate);
  const eventsQuery = useEventsQuery({
    from: monthRange.from.toISOString(),
    to: monthRange.to.toISOString(),
    ministryScope: ministryFilter === "ALL" ? undefined : ministryFilter,
    type: typeFilter === "ALL" ? undefined : typeFilter,
  });

  const createEventMutation = useCreateEventMutation();
  const updateEventMutation = useUpdateEventMutation();
  const cancelEventMutation = useCancelEventMutation();

  const assignmentsQuery = useEventAssignmentsQuery(selectedEvent?.id ?? null);
  const validateAssignmentMutation = useValidateAssignmentMutation();
  const createAssignmentMutation = useCreateAssignmentMutation(selectedEvent?.id ?? null);
  const bulkAssignMutation = useBulkAssignMutation(selectedEvent?.id ?? null);
  const choirPoolQuery = useChoirRotationPoolQuery(selectedEvent?.id ?? null);
  const autoAssignMutation = useAutoAssignChoirRotationMutation(selectedEvent?.id ?? null);

  const events = useMemo(() => eventsQuery.data?.items ?? [], [eventsQuery.data?.items]);

  const groupedAgenda = useMemo(() => buildAgenda(events), [events]);
  const weeklyBlocks = useMemo(
    () => buildWeekBlocks(events, selectedDate),
    [events, selectedDate],
  );
  const monthCells = useMemo(
    () => buildMonthCells(events, selectedDate),
    [events, selectedDate],
  );

  async function onSubmitEvent(input: EventFormInput) {
    setError(null);
    const conflicts = detectEventConflicts(events, input, editingEvent?.id);
    if (conflicts.length) {
      setError(
        t("conflictDetected", {
          title: conflicts[0].title,
        }),
      );
      return;
    }

    try {
      if (editingEvent) {
        await updateEventMutation.mutateAsync({ eventId: editingEvent.id, input });
      } else {
        await createEventMutation.mutateAsync(input);
      }
      setEditorOpen(false);
      setEditingEvent(null);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, t("saveFailed")));
    }
  }

  async function onCancelEvent(eventId: string) {
    try {
      await cancelEventMutation.mutateAsync(eventId);
    } catch (cancelError) {
      setError(getApiErrorMessage(cancelError, t("cancelFailed")));
    }
  }

  async function onAssignMember(memberId: string, role?: string) {
    if (!selectedEvent) {
      return;
    }
    setAssignmentError(null);
    const payload = { eventId: selectedEvent.id, memberId, role };

    try {
      const validation = await validateAssignmentMutation.mutateAsync(payload);
      if (!validation.valid) {
        setAssignmentError(validation.message ?? t("assignmentValidationFailed"));
        return;
      }
      await createAssignmentMutation.mutateAsync(payload);
    } catch (assignError) {
      setAssignmentError(getApiErrorMessage(assignError, t("assignmentFailed")));
    }
  }

  async function onAutoAssign(count: number) {
    if (!selectedEvent) {
      return;
    }
    setAssignmentError(null);
    try {
      if (selectedEvent.ministryScope === "CHOIR") {
        await autoAssignMutation.mutateAsync(count);
        return;
      }

      const pool = choirPoolQuery.data ?? [];
      if (!pool.length) {
        setAssignmentError(t("noPoolCandidates"));
        return;
      }
      await bulkAssignMutation.mutateAsync(
        pool.slice(0, count).map((item) => ({
          eventId: selectedEvent.id,
          memberId: item.memberId,
          role: "AUTO",
        })),
      );
    } catch (autoError) {
      setAssignmentError(getApiErrorMessage(autoError, t("autoAssignFailed")));
    }
  }

  return (
    <OperationalScreen error={error}>
      <CmmsCard
        title={t("title")}
        description={t("subtitle")}
        headerAction={
          <CmmsButton
            onClick={() => {
              setEditingEvent(null);
              setError(null);
              setEditorOpen(true);
            }}
          >
            {t("createEvent")}
          </CmmsButton>
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <CmmsTabs
            items={[
              { id: "month", label: t("views.month") },
              { id: "week", label: t("views.week") },
              { id: "agenda", label: t("views.agenda") },
            ]}
            activeId={view}
            onChange={(id) => setView(id as CalendarView)}
          />
          <CmmsFormField label={t("filters.ministryLabel")} className="min-w-[160px]">
            <CmmsSelect
              value={ministryFilter}
              onChange={(event) =>
                setMinistryFilter(event.target.value as MinistryScope | "ALL")
              }
            >
              <option value="ALL">{t("filters.allMinistries")}</option>
              {ministryValues.map((value) => (
                <option key={value} value={value}>
                  {t(`ministry.${value}`)}
                </option>
              ))}
            </CmmsSelect>
          </CmmsFormField>
          <CmmsFormField label={t("filters.typeLabel")} className="min-w-[160px]">
            <CmmsSelect
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as EventType | "ALL")}
            >
              <option value="ALL">{t("filters.allTypes")}</option>
              {eventTypeValues.map((value) => (
                <option key={value} value={value}>
                  {t(`eventType.${value}`)}
                </option>
              ))}
            </CmmsSelect>
          </CmmsFormField>
          <div className="ml-auto flex items-center gap-2">
            <CmmsButton
              variant="secondary"
              size="sm"
              onClick={() =>
                setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
              }
            >
              {t("prev")}
            </CmmsButton>
            <span className="text-sm font-medium text-[var(--foreground)]">
              {formatMonthYear(selectedDate)}
            </span>
            <CmmsButton
              variant="secondary"
              size="sm"
              onClick={() =>
                setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
              }
            >
              {t("next")}
            </CmmsButton>
          </div>
        </div>
      </CmmsCard>

      {eventsQuery.isLoading ? (
        <CmmsCard title={t("calendar.title")}>
          <CmmsSkeleton className="h-64" />
        </CmmsCard>
      ) : eventsQuery.isError ? (
        <CmmsCard title={t("calendar.title")}>
          <CmmsAlert variant="error">{t("loadFailed")}</CmmsAlert>
        </CmmsCard>
      ) : events.length === 0 ? (
        <CmmsEmptyState
          title={t("calendar.emptyTitle")}
          description={t("calendar.noEvents")}
          actionLabel={t("createEvent")}
          onAction={() => {
            setEditingEvent(null);
            setError(null);
            setEditorOpen(true);
          }}
        />
      ) : view === "month" ? (
        <MonthGrid
          t={t}
          cells={monthCells}
          onEdit={(event) => {
            setEditingEvent(event);
            setEditorOpen(true);
          }}
          onAssign={(event) => {
            setSelectedEvent(event);
            setAssignmentOpen(true);
          }}
          onCancel={onCancelEvent}
        />
      ) : view === "week" ? (
        <WeekView
          t={t}
          blocks={weeklyBlocks}
          onEdit={(event) => {
            setEditingEvent(event);
            setEditorOpen(true);
          }}
          onAssign={(event) => {
            setSelectedEvent(event);
            setAssignmentOpen(true);
          }}
          onCancel={onCancelEvent}
        />
      ) : (
        <AgendaView
          t={t}
          groups={groupedAgenda}
          onEdit={(event) => {
            setEditingEvent(event);
            setEditorOpen(true);
          }}
          onAssign={(event) => {
            setSelectedEvent(event);
            setAssignmentOpen(true);
          }}
          onCancel={onCancelEvent}
        />
      )}

      <EventEditorModal
        key={editingEvent?.id ?? "new"}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingEvent(null);
        }}
        editingEvent={editingEvent}
        onSubmit={onSubmitEvent}
        labels={t}
        submitting={createEventMutation.isPending || updateEventMutation.isPending}
      />

      <AssignmentModal
        open={assignmentOpen}
        onClose={() => setAssignmentOpen(false)}
        event={selectedEvent}
        assignments={assignmentsQuery.data?.items ?? []}
        pool={choirPoolQuery.data ?? []}
        loading={assignmentsQuery.isLoading}
        labels={t}
        error={assignmentError}
        assigning={createAssignmentMutation.isPending}
        autoAssigning={bulkAssignMutation.isPending || autoAssignMutation.isPending}
        onAssignMember={onAssignMember}
        onAutoAssign={onAutoAssign}
      />
    </OperationalScreen>
  );
}

function MonthGrid({
  t,
  cells,
  onEdit,
  onAssign,
  onCancel,
}: {
  t: (key: string) => string;
  cells: Array<{ date: Date; inMonth: boolean; events: EventItem[] }>;
  onEdit: (event: EventItem) => void;
  onAssign: (event: EventItem) => void;
  onCancel: (eventId: string) => void;
}) {
  return (
    <CmmsCard title={t("calendar.monthTitle")}>
      <div className="grid grid-cols-7 gap-3 text-xs font-semibold uppercase text-[var(--muted-foreground)]">
        {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
          <div key={day}>{t(`weekdays.${day}`)}</div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {cells.map((cell) => (
          <div
            key={cell.date.toISOString()}
            className={`min-h-36 rounded-[var(--radius-xl)] border border-[var(--border)] p-3 ${
              cell.inMonth ? "bg-[var(--surface)]" : "bg-[var(--surface-subtle)] opacity-70"
            }`}
          >
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {cell.date.getDate()}
            </div>
            <div className="mt-2 space-y-2">
              {cell.events.slice(0, 3).map((event) => (
                <EventChip
                  key={event.id}
                  event={event}
                  onEdit={onEdit}
                  onAssign={onAssign}
                  onCancel={onCancel}
                />
              ))}
              {cell.events.length > 3 ? (
                <p className="text-xs text-[var(--muted-foreground)]">
                  +{cell.events.length - 3} {t("calendar.more")}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </CmmsCard>
  );
}

function WeekView({
  t,
  blocks,
  onEdit,
  onAssign,
  onCancel,
}: {
  t: (key: string) => string;
  blocks: Array<{ date: Date; events: EventItem[] }>;
  onEdit: (event: EventItem) => void;
  onAssign: (event: EventItem) => void;
  onCancel: (eventId: string) => void;
}) {
  return (
    <CmmsCard title={t("calendar.weekTitle")}>
      <div className="grid gap-4 lg:grid-cols-7">
        {blocks.map((block) => (
          <div key={block.date.toISOString()} className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {formatDay(block.date)}
            </p>
            <div className="mt-3 space-y-2">
              {block.events.length ? (
                block.events.map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    onEdit={onEdit}
                    onAssign={onAssign}
                    onCancel={onCancel}
                  />
                ))
              ) : (
                <p className="text-xs text-[var(--muted-foreground)]">{t("calendar.noEvents")}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </CmmsCard>
  );
}

function AgendaView({
  t,
  groups,
  onEdit,
  onAssign,
  onCancel,
}: {
  t: (key: string) => string;
  groups: Array<{ label: string; events: EventItem[] }>;
  onEdit: (event: EventItem) => void;
  onAssign: (event: EventItem) => void;
  onCancel: (eventId: string) => void;
}) {
  return (
    <CmmsCard title={t("calendar.agendaTitle")}>
      <CmmsTable
        rows={groups.flatMap((group) =>
          group.events.map((event) => ({
            group: group.label,
            event,
          })),
        )}
        emptyState={t("calendar.noEvents")}
        columns={[
          {
            key: "day",
            header: t("table.day"),
            render: (row) => row.group,
          },
          {
            key: "event",
            header: t("table.event"),
            render: (row) => (
              <div>
                <p className="font-medium">{row.event.title}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatTimeRange(row.event.startTime, row.event.endTime)}
                </p>
              </div>
            ),
          },
          {
            key: "type",
            header: t("table.type"),
            render: (row) => <CmmsBadge variant="info">{row.event.type}</CmmsBadge>,
          },
          {
            key: "actions",
            header: t("table.actions"),
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <CmmsButton variant="secondary" size="sm" onClick={() => onEdit(row.event)}>
                  {t("actions.edit")}
                </CmmsButton>
                <CmmsButton variant="secondary" size="sm" onClick={() => onAssign(row.event)}>
                  {t("actions.assign")}
                </CmmsButton>
                {row.event.status !== "CANCELLED" ? (
                  <CmmsButton
                    variant="danger"
                    size="sm"
                    onClick={() => onCancel(row.event.id)}
                  >
                    {t("actions.cancel")}
                  </CmmsButton>
                ) : null}
              </div>
            ),
          },
        ]}
      />
    </CmmsCard>
  );
}

function EventChip({
  event,
  onEdit,
  onAssign,
  onCancel,
}: {
  event: EventItem;
  onEdit: (event: EventItem) => void;
  onAssign: (event: EventItem) => void;
  onCancel: (eventId: string) => void;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-2 py-2">
      <p className="truncate text-xs font-semibold text-[var(--foreground)]">{event.title}</p>
      <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
        {formatTimeRange(event.startTime, event.endTime)}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <button className="text-[11px] text-[var(--primary)]" onClick={() => onEdit(event)}>
          Edit
        </button>
        <button className="text-[11px] text-[var(--primary)]" onClick={() => onAssign(event)}>
          Assign
        </button>
        {event.status !== "CANCELLED" ? (
          <button
            className="text-[11px] text-rose-600"
            onClick={() => onCancel(event.id)}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EventEditorModal({
  open,
  onClose,
  editingEvent,
  onSubmit,
  labels,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  editingEvent: EventItem | null;
  onSubmit: (input: EventFormInput) => Promise<void>;
  labels: (key: string, values?: Record<string, string | number>) => string;
  submitting: boolean;
}) {
  const [title, setTitle] = useState(editingEvent?.title ?? "");
  const [type, setType] = useState<EventType>(editingEvent?.type ?? "CHURCH_EVENT");
  const [ministryScope, setMinistryScope] = useState<MinistryScope>(
    editingEvent?.ministryScope ?? "BOTH",
  );
  const [status, setStatus] = useState<EventStatus>(editingEvent?.status ?? "SCHEDULED");
  const [startTime, setStartTime] = useState(
    editingEvent ? toDateTimeLocal(editingEvent.startTime) : "",
  );
  const [endTime, setEndTime] = useState(
    editingEvent ? toDateTimeLocal(editingEvent.endTime) : "",
  );
  const [location, setLocation] = useState(editingEvent?.location ?? "");
  const [serviceSlot, setServiceSlot] = useState(
    editingEvent?.serviceSlot != null ? String(editingEvent.serviceSlot) : "",
  );
  const [description, setDescription] = useState(
    editingEvent?.metadata?.description ?? "",
  );
  const [recurrenceRule, setRecurrenceRule] = useState(
    editingEvent?.metadata?.recurrenceRule ?? "NONE",
  );

  return (
    <CmmsModal
      open={open}
      onClose={onClose}
      title={editingEvent ? labels("editor.editTitle") : labels("editor.createTitle")}
      className="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <CmmsButton type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {labels("actions.close")}
          </CmmsButton>
          <CmmsButton type="submit" form="event-editor-form" disabled={submitting}>
            {submitting ? labels("saving") : labels("actions.save")}
          </CmmsButton>
        </div>
      }
    >
      <form
        id="event-editor-form"
        className="cmms-section-stack md:grid md:grid-cols-2 md:gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit({
            title,
            type,
            ministryScope,
            status,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            location: location || undefined,
            serviceSlot: serviceSlot ? Number(serviceSlot) : undefined,
            description: description || undefined,
            recurrenceRule: recurrenceRule === "NONE" ? undefined : recurrenceRule,
          });
        }}
      >
        <CmmsFormField label={labels("editor.title")} required>
          <CmmsInput value={title} onChange={(event) => setTitle(event.target.value)} required />
        </CmmsFormField>
        <CmmsFormField label={labels("editor.type")}>
          <CmmsSelect value={type} onChange={(event) => setType(event.target.value as EventType)}>
            {eventTypeValues.map((value) => (
              <option key={value} value={value}>
                {labels(`eventType.${value}`)}
              </option>
            ))}
          </CmmsSelect>
        </CmmsFormField>
        <CmmsFormField label={labels("editor.ministryScope")}>
          <CmmsSelect
            value={ministryScope}
            onChange={(event) => setMinistryScope(event.target.value as MinistryScope)}
          >
            {ministryValues.map((value) => (
              <option key={value} value={value}>
                {labels(`ministry.${value}`)}
              </option>
            ))}
          </CmmsSelect>
        </CmmsFormField>
        <CmmsFormField label={labels("editor.status")}>
          <CmmsSelect value={status} onChange={(event) => setStatus(event.target.value as EventStatus)}>
            {statusValues.map((value) => (
              <option key={value} value={value}>
                {labels(`status.${value}`)}
              </option>
            ))}
          </CmmsSelect>
        </CmmsFormField>
        <CmmsFormField label={labels("editor.startTime")} required>
          <CmmsInput
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            required
          />
        </CmmsFormField>
        <CmmsFormField label={labels("editor.endTime")} required>
          <CmmsInput
            type="datetime-local"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            required
          />
        </CmmsFormField>
        <CmmsFormField label={labels("editor.location")}>
          <CmmsInput value={location} onChange={(event) => setLocation(event.target.value)} />
        </CmmsFormField>
        <CmmsFormField label={labels("editor.serviceSlot")}>
          <CmmsInput
            type="number"
            min={1}
            value={serviceSlot}
            onChange={(event) => setServiceSlot(event.target.value)}
          />
        </CmmsFormField>
        <CmmsFormField label={labels("editor.description")} className="md:col-span-2">
          <CmmsInput value={description} onChange={(event) => setDescription(event.target.value)} />
        </CmmsFormField>
        <CmmsFormField label={labels("editor.recurrence")} className="md:col-span-2">
          <CmmsSelect value={recurrenceRule} onChange={(event) => setRecurrenceRule(event.target.value)}>
            {recurrencePresets.map((preset) => (
              <option key={preset} value={preset}>
                {labels(`recurrence.${preset}`)}
              </option>
            ))}
          </CmmsSelect>
        </CmmsFormField>
      </form>
    </CmmsModal>
  );
}

function AssignmentModal({
  open,
  onClose,
  event,
  assignments,
  pool,
  loading,
  labels,
  error,
  assigning,
  autoAssigning,
  onAssignMember,
  onAutoAssign,
}: {
  open: boolean;
  onClose: () => void;
  event: EventItem | null;
  assignments: Array<{
    id: string;
    memberId: string;
    role?: string | null;
    member: { firstName: string; lastName: string; ministry: string };
  }>;
  pool: Array<{ memberId: string; firstName: string; lastName: string; ministry: string }>;
  loading: boolean;
  labels: (key: string, values?: Record<string, string | number>) => string;
  error: string | null;
  assigning: boolean;
  autoAssigning: boolean;
  onAssignMember: (memberId: string, role?: string) => Promise<void>;
  onAutoAssign: (count: number) => Promise<void>;
}) {
  const [memberId, setMemberId] = useState("");
  const [role, setRole] = useState("");
  const [autoCount, setAutoCount] = useState("3");

  const memberOptions = pool.length
    ? pool
    : assignments.map((row) => ({
        memberId: row.memberId,
        firstName: row.member.firstName,
        lastName: row.member.lastName,
        ministry: row.member.ministry,
      }));

  return (
    <CmmsModal
      open={open}
      onClose={onClose}
      title={labels("assignments.title", { event: event?.title ?? "-" })}
      className="max-w-3xl"
    >
      <div className="cmms-section-stack">
        {error ? <CmmsAlert variant="error">{error}</CmmsAlert> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <CmmsFormField label={labels("assignments.memberId")} required>
            {memberOptions.length ? (
              <CmmsSelect
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
              >
                <option value="">{labels("assignments.memberPlaceholder")}</option>
                {memberOptions.map((candidate) => (
                  <option key={candidate.memberId} value={candidate.memberId}>
                    {candidate.firstName} {candidate.lastName}
                  </option>
                ))}
              </CmmsSelect>
            ) : (
              <CmmsInput
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
                placeholder={labels("assignments.memberPlaceholder")}
              />
            )}
          </CmmsFormField>
          <CmmsFormField label={labels("assignments.role")}>
            <CmmsInput
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="LEAD"
            />
          </CmmsFormField>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <CmmsButton
            disabled={!memberId || assigning}
            onClick={async () => {
              await onAssignMember(memberId, role || undefined);
              setMemberId("");
              setRole("");
            }}
          >
            {assigning ? labels("assignments.assigning") : labels("assignments.assignMember")}
          </CmmsButton>
          <CmmsFormField label={labels("assignments.autoCountLabel")} className="w-24">
            <CmmsInput
              value={autoCount}
              onChange={(event) => setAutoCount(event.target.value)}
              type="number"
              min={1}
            />
          </CmmsFormField>
          <CmmsButton
            variant="secondary"
            disabled={autoAssigning}
            onClick={async () => onAutoAssign(Number(autoCount || 1))}
          >
            {autoAssigning ? labels("assignments.autoAssigning") : labels("assignments.autoAssign")}
          </CmmsButton>
        </div>

        <CmmsCard title={labels("assignments.poolTitle")} description={labels("assignments.poolSubtitle")}>
          {pool.length ? (
            <div className="flex flex-wrap gap-2">
              {pool.slice(0, 12).map((candidate) => (
                <CmmsButton
                  key={candidate.memberId}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setMemberId(candidate.memberId)}
                >
                  {candidate.firstName} {candidate.lastName}
                </CmmsButton>
              ))}
            </div>
          ) : (
            <CmmsEmptyState
              title={labels("assignments.noPool")}
              description={labels("assignments.noPoolDescription")}
            />
          )}
        </CmmsCard>

        <CmmsCard title={labels("assignments.currentTitle")}>
          {loading ? (
            <CmmsSkeleton className="h-32" />
          ) : (
            <CmmsTable
              compact
              rows={assignments}
              emptyState={
                <CmmsEmptyState title={labels("assignments.noneTitle")} description={labels("assignments.none")} />
              }
              columns={[
                {
                  key: "name",
                  header: labels("table.member"),
                  render: (row) => `${row.member.firstName} ${row.member.lastName}`,
                },
                {
                  key: "role",
                  header: labels("table.role"),
                  render: (row) => row.role ?? "-",
                },
                {
                  key: "ministry",
                  header: labels("table.ministry"),
                  render: (row) => row.member.ministry,
                },
              ]}
            />
          )}
        </CmmsCard>
      </div>
    </CmmsModal>
  );
}

function getMonthRange(reference: Date) {
  const from = new Date(reference.getFullYear(), reference.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

function buildMonthCells(events: EventItem[], reference: Date) {
  const firstOfMonth = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const firstDay = new Date(firstOfMonth);
  firstDay.setDate(firstDay.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + index);
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    return {
      date,
      inMonth: date.getMonth() === reference.getMonth(),
      events: events.filter((event) => {
        const start = new Date(event.startTime);
        return start >= date && start < next;
      }),
    };
  });
}

function buildWeekBlocks(events: EventItem[], reference: Date) {
  const start = new Date(reference);
  start.setDate(reference.getDate() - reference.getDay());
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    return {
      date,
      events: events.filter((event) => {
        const eventStart = new Date(event.startTime);
        return eventStart >= date && eventStart < next;
      }),
    };
  });
}

function buildAgenda(events: EventItem[]) {
  const grouped = new Map<string, EventItem[]>();
  for (const event of events) {
    const key = new Date(event.startTime).toDateString();
    const current = grouped.get(key) ?? [];
    current.push(event);
    grouped.set(key, current);
  }
  return Array.from(grouped.entries()).map(([label, rows]) => ({
    label,
    events: rows.sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)),
  }));
}

function detectEventConflicts(events: EventItem[], draft: EventFormInput, selfId?: string) {
  const draftStart = +new Date(draft.startTime);
  const draftEnd = +new Date(draft.endTime);

  return events.filter((event) => {
    if (selfId && event.id === selfId) {
      return false;
    }
    if (
      event.location &&
      draft.location &&
      event.location.trim().toLowerCase() !== draft.location.trim().toLowerCase()
    ) {
      return false;
    }

    const eventStart = +new Date(event.startTime);
    const eventEnd = +new Date(event.endTime);
    return draftStart < eventEnd && draftEnd > eventStart;
  });
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric" }).format(date);
}

function formatTimeRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}
