import type { Meta, StoryObj } from "@storybook/react";

import { PendingApprovalScreen } from "@/features/auth/components/pending-approval-screen";
import { useSessionStore } from "@/core/auth/session-store";

function PendingStory() {
  useSessionStore.setState({
    accessToken: "demo-token",
    profile: {
      id: "demo-user",
      email: "pending@church.local",
      roles: ["MEMBER"],
      permissions: ["event:read"],
      onboardingCompleted: false,
      member: {
        firstName: "Marie",
        lastName: "Uwera",
        ministry: "CHOIR",
        status: "NEW_MEMBER",
      },
    },
    status: "ready",
  });

  return <PendingApprovalScreen />;
}

const meta = {
  title: "Auth/Onboarding",
  component: PendingStory,
} satisfies Meta<typeof PendingStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PendingApproval: Story = {};
