# Choir Membership Rules

Enforced in `ChoirMembershipRulesService` using `Choir.choirKind`:

| Kind | Examples |
|------|----------|
| PRIMARY | Elim, Integuza, El-Bethel, Beulah, Ijwi, Children's Choir |
| SPECIAL | Yerusalemu (morning service) |

## Rules

- **One primary slot**: at most one active PRIMARY or CHILDREN choir membership.
- **Yerusalemu exception**: PRIMARY + SPECIAL (Yerusalemu) is allowed.
- **Forbidden**: two PRIMARY choirs (e.g. Elim + Integuza).

Validation runs on join request submit and on admin approval.
