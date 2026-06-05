# Choir Discovery

Route: `/choirs` (authenticated)

Lists public joinable choirs via `GET /church/public/choirs` or `GET /choirs/public` when signed in.

## Join rules

- One primary choir per member
- Yerusalemu (`SPECIAL` kind) may coexist with one primary choir
- Join creates `ChoirJoinRequest` for leader review — not instant membership

## Seeded choirs (pilot)

Ijwi ry'Umwami Yesu, Elim, Integuza, El-Bethel, Beulah, Children's Choir, Yerusalemu
