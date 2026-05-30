import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { CmmsAlert } from "@/components/ui/cmms-alert";
import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { CmmsFormField } from "@/components/ui/cmms-form-field";
import { CmmsModal } from "@/components/ui/cmms-modal";
import { CmmsSelect } from "@/components/ui/cmms-select";
import { CmmsSkeleton, CmmsDashboardSkeleton } from "@/components/ui/cmms-skeleton";
import { CmmsTabs } from "@/components/ui/cmms-tabs";
import { CmmsTable } from "@/components/ui/cmms-table";
import { OperationalScreen } from "@/components/ui/operational-screen";

const meta: Meta = {
  title: "CMMS/Components",
};

export default meta;

export const Buttons: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CmmsButton variant="primary">Primary</CmmsButton>
      <CmmsButton variant="secondary">Secondary</CmmsButton>
      <CmmsButton variant="primary" disabled>
        Disabled
      </CmmsButton>
    </div>
  ),
};

export const Badges: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CmmsBadge variant="success">Paid</CmmsBadge>
      <CmmsBadge variant="warning">Partial</CmmsBadge>
      <CmmsBadge variant="danger">Unpaid</CmmsBadge>
      <CmmsBadge variant="info">Info</CmmsBadge>
    </div>
  ),
};

export const Alerts: StoryObj = {
  render: () => (
    <div className="cmms-section-stack max-w-md">
      <CmmsAlert variant="error">Unable to save attendance right now.</CmmsAlert>
      <CmmsAlert variant="success">Committee assignment saved.</CmmsAlert>
      <CmmsAlert variant="info">Review pending excuses in the Excused tab.</CmmsAlert>
    </div>
  ),
};

export const Card: StoryObj = {
  render: () => (
    <CmmsCard title="Stewardship summary" description="Ministry-scoped finance overview.">
      <p className="cmms-text-body text-[var(--muted-foreground)]">
        Calm, breathable card layout for operational content.
      </p>
    </CmmsCard>
  ),
};

export const EmptyState: StoryObj = {
  render: () => (
    <CmmsEmptyState
      title="No contributions recorded yet"
      description="When your ministry records dues or offerings, they will appear here."
      actionLabel="Learn more"
      onAction={() => undefined}
    />
  ),
};

export const FormField: StoryObj = {
  render: () => (
    <CmmsFormField label="Committee role" hint="Permissions apply on next login." required>
      <CmmsSelect defaultValue="">
        <option value="">Choose role…</option>
        <option value="treasurer">Treasurer</option>
      </CmmsSelect>
    </CmmsFormField>
  ),
};

export const Tabs: StoryObj = {
  render: function TabsStory() {
    const [active, setActive] = useState("today");
    return (
      <CmmsTabs
        items={[
          { id: "today", label: "Today" },
          { id: "excused", label: "Excused" },
          { id: "history", label: "History" },
        ]}
        activeId={active}
        onChange={setActive}
      />
    );
  },
};

export const Table: StoryObj = {
  render: () => (
    <CmmsTable
      columns={[
        { key: "name", header: "Member", render: (r) => r.name },
        { key: "status", header: "Status", render: (r) => <CmmsBadge>{r.status}</CmmsBadge> },
      ]}
      rows={[
        { name: "Jean Mukiza", status: "Present" },
        { name: "Alice Ingabire", status: "Excused" },
      ]}
      emptyState="No rows"
    />
  ),
};

export const TableEmpty: StoryObj = {
  render: () => (
    <CmmsTable<{ name: string }>
      columns={[{ key: "name", header: "Member", render: (r) => r.name }]}
      rows={[]}
      emptyState={
        <CmmsEmptyState title="No members assigned" description="Assign members from the event engine." />
      }
    />
  ),
};

export const Skeleton: StoryObj = {
  render: () => <CmmsSkeleton className="h-24 w-full max-w-md" />,
};

export const DashboardSkeleton: StoryObj = {
  render: () => <CmmsDashboardSkeleton />,
};

export const Dialog: StoryObj = {
  render: function DialogStory() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <CmmsButton onClick={() => setOpen(true)}>Open dialog</CmmsButton>
        <CmmsModal open={open} onClose={() => setOpen(false)} title="Record excused absence">
          <CmmsFormField label="Reason">
            <CmmsSelect>
              <option>Illness</option>
              <option>Travel</option>
            </CmmsSelect>
          </CmmsFormField>
        </CmmsModal>
      </>
    );
  },
};

export const OperationalScreenExample: StoryObj = {
  render: function ScreenStory() {
    const [tab, setTab] = useState("today");
    return (
      <OperationalScreen
        title="Attendance governance"
        subtitle="Mark operational attendance for your ministry."
        tabs={[
          { id: "today", label: "Today" },
          { id: "excused", label: "Excused" },
        ]}
        activeTabId={tab}
        onTabChange={setTab}
      >
        <CmmsCard title="Upcoming events">
          <CmmsEmptyState title="Nothing to mark yet" description="No upcoming events in the next 30 days." />
        </CmmsCard>
      </OperationalScreen>
    );
  },
};

export const LongKinyarwandaLabel: StoryObj = {
  render: () => (
    <CmmsFormField label="Imisanzu y'umuryango w'itorero — umwaka wa 2026">
      <CmmsSelect>
        <option>Hitamo…</option>
      </CmmsSelect>
    </CmmsFormField>
  ),
};

export const LongFrenchLabel: StoryObj = {
  render: () => (
    <CmmsTabs
      items={[
        { id: "a", label: "Gouvernance des contributions" },
        { id: "b", label: "Stewardship financier du protocole" },
      ]}
      activeId="a"
      onChange={() => undefined}
    />
  ),
};
