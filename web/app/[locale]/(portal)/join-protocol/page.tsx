"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CmmsCard } from "@/components/ui/cmms-card";
import { http, getApiErrorMessage } from "@/core/api/http";

export default function JoinProtocolPage() {
  return (
    <ProtectedRoute>
      <JoinProtocolContent />
    </ProtectedRoute>
  );
}

function JoinProtocolContent() {
  const [message, setMessage] = useState<string | null>(null);

  async function submitClaim() {
    try {
      await http.post("/protocol/claims", {
        message: "I am already a Protocol member",
      });
      setMessage("Claim submitted for coordinator review.");
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6 cmms-page-stack">
      <h1 className="cmms-text-display">Protocol membership</h1>
      <CmmsCard title="Invitation only">
        <p className="text-sm text-[var(--muted-foreground)]">
          New protocol members are invited by coordinators. If you already serve
          on the protocol team, submit a claim for review.
        </p>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-[var(--primary)]"
          onClick={submitClaim}
        >
          I am already a Protocol member
        </button>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </CmmsCard>
    </div>
  );
}
