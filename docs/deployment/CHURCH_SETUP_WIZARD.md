# Church Setup Wizard

First-time deployment for a new church installation.

## APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/setup` | Wizard state + step list + readiness |
| POST | `/api/v1/setup` | Save step `{ step: 1-7, data: {...} }` |
| GET | `/api/v1/setup/status` | Completion flag + readiness score |
| PATCH | `/api/v1/setup/configuration` | Local rules (service times, choir/protocol rules) |

## Steps

1. **Church information** — name, location, contact, language  
2. **Leadership** — pastor, deputies, secretary, treasurer, advisors  
3. **Ministries** — enable, disable, create custom  
4. **Choirs** — primary, special, children choirs  
5. **Protocol** — unit, coordinator, team leaders  
6. **Services** — Sunday 1/2, Tuesday, Igaburo, Nibature templates  
7. **Review** — marks `setupCompleted` and returns readiness score  

## Permissions

`admin.settings.manage` or `pilot.readiness.view`
