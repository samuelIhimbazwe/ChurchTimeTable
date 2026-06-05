# Protocol Discovery

Route: `/protocol` (authenticated)

Explains protocol ministry responsibilities. **No open self-join.**

## Existing members

Button **"I am already a protocol member"** creates a `ProtocolMembershipClaim` for coordinator review.

## Invitations

New protocol members join via leader invitation (`POST /protocol/invitations`). Members respond at `/my-invitations`.
