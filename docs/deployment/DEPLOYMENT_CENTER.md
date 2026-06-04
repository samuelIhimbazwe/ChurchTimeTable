# Admin Deployment Center

Web route: `/dashboard/admin/deployment`

## Sections

- **Setup wizard** — `GET/POST /api/v1/setup`  
- **Imports** — `POST /api/v1/imports`, confirm, cancel, results  
- **Exports** — `GET /api/v1/pilot/exports/:type?format=csv|pdf|xlsx`  
- **Readiness** — `GET /api/v1/setup/readiness`  
- **Demo data** — `POST /api/v1/setup/demo/generate`  
- **Checklist** — church intelligence + `docs/DEPLOYMENT_CHECKLIST.md`  

Also linked from `/dashboard/admin/tools`.
