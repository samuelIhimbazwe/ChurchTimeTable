# Sprint 10.2.6 — Thank-You & Notification Engine (Frozen)

**Status:** ✅ Complete  
**Tests:** `backend/test/sprint-10.2.6-thank-you.e2e-spec.ts`

---

## Trigger

Thank-you runs **only** after family approval:

```
SUBMITTED → CONFIRMED (POST .../family/approve) → ThankYouService
```

Never on `SUBMITTED` or `REJECTED`.

Legacy treasurer `POST .../confirm` still triggers thank-you via `ContributionService`.

---

## Notify

| Recipient | Thank-you |
|-----------|-----------|
| Submitting member | ✅ in-app (`contribution_thank_you`) |
| Secretary / President / VP / Treasurer / Coordinator | ❌ no per-contribution spam |

Rejection uses separate `contribution_rejected` notification (10.2.3).

---

## Channels

| Channel | Status |
|---------|--------|
| In-app | ✅ `NotificationsService.sendContributionThankYou` |
| SMS | Architecture ready (`ContributionSmsChannel`); disabled unless `SMS_ENABLED=true` |

Amount in message: **`confirmedAmount`** (not claimed).

---

## Idempotency

1. Approve transaction is single-flight (409 on re-approve).
2. Thank-you claims `thankYouDeliveryStatus: PENDING → SENT` before sending in-app message.
3. `hasAlreadySent` short-circuits automatic replays.

One confirmation → one thank-you.

---

## Audit

| Action | When |
|--------|------|
| `CONTRIBUTION_THANK_YOU_SENT` | Automatic send after family confirm |
| `CONTRIBUTION_THANK_YOU_RESEND` | Manual resend by finance role |
| `CONTRIBUTION_THANK_YOU_FAILED` | Delivery failure (no user account, notification error) |

---

## API

```
POST /api/v1/finance/contributions/:id/resend-thank-you
```

Finance manage scope only; member cannot resend.

---

## Next

- **10.2.7** — Adjustment engine finalization
- **10.2.8** — Leadership history
