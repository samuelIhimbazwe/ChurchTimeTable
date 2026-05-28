# Igiharuro cy' amagambo y' itorero (Kinyarwanda — canonical)

Aya magambo ni **standard** mu CMMS. Ntukoreshe ubuhinduzi bw' icyongereza mu buryo butaziguye.

## Imirimo & abantu

| English | Kinyarwanda (use in app) | Notes |
|---------|--------------------------|-------|
| Choir | **Korali** | Not "itorero choir" |
| Protocol | **Protocol** / Abakira abashyitsi | Ministry name stays Protocol |
| Member | **Umunyamuryango** | |
| Leader | **Umuyobozi** | |
| Committee | **Komite** | |
| Treasurer | **Umubitsi** | |
| Secretary | **Umunyamabanga** | |

## Ibikorwa & gahunda

| English | Kinyarwanda | Notes |
|---------|-------------|-------|
| Event | **Igikorwa** | |
| Worship service | **Iteraniro** | Sunday/main service |
| Rehearsal | **Imyitozo** | Choir/protocol practice |
| Schedule | **Gahunda** | |
| Responsibility / Assignment | **Inshingano** | Being placed on duty |
| Announcement | **Itangazo** | |

## Imikorere y'itorero

| English | Kinyarwanda | Notes |
|---------|-------------|-------|
| Attendance (module) | **Uko witabiriye** | Not generic "kwitabira" |
| Swap | **Gusimburana** | Mutual exchange of duty |
| Replacement | **Gusimbura** | One covers another |
| Discipline | **Imyitwarire** | Conduct / character |
| Finance (choir) | **Imari ya Korali** | |

## Uko witabiriye — status

| English | Kinyarwanda |
|---------|-------------|
| Present | **Yitabiriye** |
| Absent | **Ntiyitabiriye** |
| Late | **Yakererewe** |
| Excused (reason) | **Yasobanuye impamvu** |
| Unexcused (reason) | **Nta mpamvu yumvikana** |

## Imyitwarire — workflow

| English | Kinyarwanda |
|---------|-------------|
| Reported | **Byatangajwe** |
| Under review | **Birasuzumwa** |
| Decision pending | **Icyemezo gitegerejwe** |
| Actioned | **Byafatiwe icyemezo** |
| Closed | **Byarangiye** |

## Gusimburana — status (API → UI)

| API `SwapStatus` | Kinyarwanda label |
|------------------|-------------------|
| REQUESTED | Byasabwe |
| TARGET_ACCEPTED | Byemewe n' uwusimburwa |
| TARGET_REJECTED | Byanze n' uwusimburwa |
| LEADER_PENDING | Bitegereje umuyobozi |
| APPROVED | Byemewe n' umuyobozi |
| REJECTED | Byanze |
| FINALIZED | Byarangiye |
| CANCELLED | Byahagaritswe |

## Amakuru (notifications) — style

- Use full natural sentences with placeholders: `{memberName}`, `{eventName}`, `{amount}`.
- Example: **"{memberName} yasabye ko musimburana"** — not "Swap request".
