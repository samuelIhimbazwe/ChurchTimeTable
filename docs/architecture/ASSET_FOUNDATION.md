# Asset Foundation (MF-4)

## Purpose

Reusable **Resource & Asset Management** for all ADEPR ministries and operational units, without coupling to Protocol procurement or choir-only tables.

## Core principle

**Ownership ≠ Assignment ≠ Custody**

| Concept | Model | Meaning |
|---------|--------|---------|
| Ownership | `AssetOwnership` | Who paid for / shares the asset (CHURCH, MINISTRY, OPERATIONAL_UNIT) |
| Custody | `AssetCustodian` | Member accountable for condition and return |
| Assignment | `AssetAssignment` | Where the asset is deployed (ministry, unit, member) |

## Domain models

- `Asset` — canonical inventory record
- `AssetCategory` — system-seeded + custom categories
- `UniformProfile` / `InstrumentProfile` — specialized layers on `Asset` (no parallel inventory)
- `AssetMaintenance` — repairs, service, inspection, upgrade
- `AssetActivity` — immutable timeline

## API namespace

`/api/v1/assets/*` — permission-gated (`asset.view`, `asset.manage`, …).

## Visibility

Users see assets when they have global `asset.view` **or** visibility to any ownership row (ministry membership / unit membership).

## Legacy choir tables

`UniformType`, `EquipmentAsset`, etc. remain for choir MVP; new work uses MF-4 models. Migrate via `CHOIR_MIGRATION_PLAN.md` when ready.
