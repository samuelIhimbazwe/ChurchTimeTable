"use client";

import type { ReactNode } from "react";

import { useSessionStore } from "@/core/auth/session-store";
import {
  canAccessChoirPresidentActionCenter,
  canAccessProtocolCoordinatorActionCenter,
  canAccessProtocolTeamLeaderActionCenter,
} from "@/core/auth/governance-permissions";
import { ChoirPresidentActionCenter } from "@/features/dashboard/components/action-centers/choir-president-action-center";
import { ProtocolCoordinatorActionCenter } from "@/features/dashboard/components/action-centers/protocol-coordinator-action-center";
import { ProtocolTeamLeaderActionCenter } from "@/features/dashboard/components/action-centers/protocol-team-leader-action-center";

type LeadershipActionCentersProps = {
  showChoirPresident?: boolean;
  showProtocolCoordinator?: boolean;
  showProtocolTeamLeader?: boolean;
};

export function LeadershipActionCenters({
  showChoirPresident = true,
  showProtocolCoordinator = true,
  showProtocolTeamLeader = true,
}: LeadershipActionCentersProps) {
  const perms = useSessionStore((s) => s.profile?.permissions ?? []);

  const panels: ReactNode[] = [];

  if (showChoirPresident && canAccessChoirPresidentActionCenter(perms)) {
    panels.push(<ChoirPresidentActionCenter key="choir-president" />);
  }
  if (showProtocolCoordinator && canAccessProtocolCoordinatorActionCenter(perms)) {
    panels.push(<ProtocolCoordinatorActionCenter key="protocol-coordinator" />);
  }
  if (showProtocolTeamLeader && canAccessProtocolTeamLeaderActionCenter(perms)) {
    panels.push(<ProtocolTeamLeaderActionCenter key="protocol-team-leader" />);
  }

  if (panels.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2" data-testid="leadership-action-centers">
      {panels}
    </div>
  );
}
