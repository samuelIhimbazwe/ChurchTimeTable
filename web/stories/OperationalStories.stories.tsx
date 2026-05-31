import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { CmmsDashboardSkeleton } from "@/components/ui/cmms-skeleton";
import { AttendanceEscalationDialog } from "@/features/attendance/components/attendance-review-dialogs";
import { AttendanceMarkDialog } from "@/features/attendance/components/attendance-mark-dialog";
import { CoverageReviewDialog } from "@/features/coverage/components/coverage-review-dialog";

const meta: Meta = {
  title: "CMMS/Operational",
};

export default meta;

export const AttendanceMarkDialogStory: StoryObj = {
  render: function Story() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <CmmsButton onClick={() => setOpen(true)}>Open mark dialog</CmmsButton>
        <AttendanceMarkDialog
          open={open}
          mode="excused"
          memberName="Jean Mukiza"
          onClose={() => setOpen(false)}
          onSubmit={async () => undefined}
        />
      </>
    );
  },
};

export const AttendanceEscalationDialogStory: StoryObj = {
  render: function Story() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <CmmsButton onClick={() => setOpen(true)}>Open escalation dialog</CmmsButton>
        <AttendanceEscalationDialog
          open={open}
          memberName="Alice Ingabire"
          onClose={() => setOpen(false)}
          onSubmit={async () => undefined}
        />
      </>
    );
  },
};

export const CoverageReviewDialogStory: StoryObj = {
  render: function Story() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <CmmsButton onClick={() => setOpen(true)}>Open coverage review</CmmsButton>
        <CoverageReviewDialog
          open={open}
          mode="approve"
          itemLabel="Jean Mukiza ↔ Alice Ingabire"
          onClose={() => setOpen(false)}
          onSubmit={async () => undefined}
        />
      </>
    );
  },
};

export const DashboardEmptyStates: StoryObj = {
  render: () => (
    <div className="cmms-section-stack max-w-lg">
      <CmmsEmptyState
        title="No upcoming assignments"
        description="When you are scheduled for a service or rehearsal, it will appear here."
      />
      <CmmsEmptyState
        title="No swap requests yet"
        description="When members request assignment swaps, they will appear here for review."
        actionLabel="Open coverage workspace"
        onAction={() => undefined}
      />
    </div>
  ),
};

export const DashboardLoading: StoryObj = {
  render: () => <CmmsDashboardSkeleton />,
};

export const AuthValidationErrors: StoryObj = {
  render: () => (
    <div className="mx-auto max-w-md space-y-4 rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="cmms-text-heading">Sign in</h2>
      <p className="text-sm text-[var(--danger)]">Invalid credentials</p>
      <p className="text-sm text-[var(--warning-foreground)]">Your session expired. Please sign in again.</p>
    </div>
  ),
};

export const FrenchLongLabels: StoryObj = {
  render: () => (
    <CmmsEmptyState
      title="Gouvernance des contributions du protocole"
      description="Lorsque votre ministère enregistre des contributions ou des cotisations, elles apparaîtront ici avec une transparence complète pour votre parcours de stewardship."
      actionLabel="Voir mes contributions"
      onAction={() => undefined}
    />
  ),
};

export const KinyarwandaLongLabels: StoryObj = {
  render: () => (
    <CmmsEmptyState
      title="Nta gahunda y'ibikorwa iboneka"
      description="Igihe uzashyirwaho mu serivisi cyangwa mu myitozo, bizagaragara hano kugira ngo ube witeguye neza."
      actionLabel="Fungura urubuga rw'ibikorwa"
      onAction={() => undefined}
    />
  ),
};
