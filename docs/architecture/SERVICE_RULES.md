# Service Rules (MF-7)

Hard validation in `ServiceRulesService` before assignments (unless `operations.override`).

| Rule | Description |
|------|-------------|
| RULE_1 | Main Choir cannot serve Sunday Service 1 and Sunday Service 2 on the same day |
| RULE_2 | Children Choir only on Sunday Service 1 |
| RULE_3 | Tuesday Service — at most one Main Choir assignment per occurrence |
| RULE_4 | IGABURO — at most one Main Choir assignment per occurrence |
| RULE_5 | Protocol team cannot overlap in time across occurrences |
| RULE_6 | Same operational unit cannot be assigned twice to one occurrence |

`GET /operations/occurrences/:id/conflicts` lists violations for existing assignments.

Special events (`SPECIAL_EVENT`) use manually defined requirements — no fixed quantity enforcement beyond optional publication checks.
