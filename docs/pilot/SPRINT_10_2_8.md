# Sprint 10.2.8 — Leadership Governance (Frozen)

**Status:** ✅ Complete  
**Tests:** `backend/test/sprint-10.2.8-leadership-governance.e2e-spec.ts`

---

## APIs

```
PATCH /api/v1/families/:id/members/:memberId   { role, reason? }
PATCH /api/v1/families/:id                       { delegationEnabled?, ... }
GET   /api/v1/families/:id/leadership-history
```

---

## Role transitions

For `HEAD`, `ASSISTANT_HEAD`, `SECRETARY`:

1. Close open `FamilyLeadershipHistory` row (`endedAt`)
2. Audit `FAMILY_LEADERSHIP_ENDED`
3. Update `FamilyMember.role`
4. Open new tenure row
5. Audit `FAMILY_LEADERSHIP_ASSIGNED`

HEAD swaps also sync `family.headMemberId`.

---

## Audits

| Action | When |
|--------|------|
| `FAMILY_LEADERSHIP_ASSIGNED` | Leadership tenure opened |
| `FAMILY_LEADERSHIP_ENDED` | Leadership tenure closed |
| `FAMILY_DELEGATION_TOGGLE` | `delegationEnabled` changed |
| `FAMILY_MEMBER_ROLE_CHANGE` | Any role patch (includes oldRole/newRole) |

---

## Historical integrity

Contribution `familyId` snapshots at submission remain unless explicitly corrected via 10.2.7 `change-family`.

Leadership history rows are append-only tenures; rankings use current assignments + confirmed effective amounts.
