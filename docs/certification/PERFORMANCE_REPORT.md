# Performance Certification Report

**Date:** 2026-05-31

## Web

| Surface | Pattern | Status |
|---------|---------|--------|
| Dashboard widgets | React Query + lazy route segments | ✅ |
| Choir reports | On-demand PDF/CSV download (blob) | ✅ |
| Search | Debounced 300ms, suggestion limit 10 | ✅ |
| Rehearsal pages | Pagination via API limits (50–100) | ✅ |
| Code splitting | Next.js App Router per-route bundles | ✅ |

**Not measured this sprint:** Core Web Vitals on slow 3G — run Lighthouse before go-live.

## Mobile

| Surface | Pattern | Status |
|---------|---------|--------|
| Choir list screens | Pull-to-refresh, cached fallback | ✅ |
| Hive offline box | `choir_offline_v1` lazy open | ✅ |
| Song/rehearsal detail | Cache-on-success, read-on-failure | ✅ |

## Backend

| API | Pattern | Status |
|-----|---------|--------|
| Search | Per-type limit, parallel queries | ✅ |
| Welfare list | Paginated (`limit` query) | ✅ |
| Reports PDF | Streamed buffer via PDFKit | ✅ |

## Targets for pilot church hardware

- Dashboard TTFB < 2s on office Wi‑Fi
- Search suggestions < 500ms p95
- Mobile cold start < 3s on mid-range Android

## Verdict

Architecture supports low-bandwidth use; **quantitative benchmarks pending** pilot measurement.
