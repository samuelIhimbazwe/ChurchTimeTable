import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PLATFORM_ADMIN_VIEW_PERMISSIONS } from "@/core/auth/governance-permissions";

const DEPLOYMENT_PERMISSIONS = [
  ...PLATFORM_ADMIN_VIEW_PERMISSIONS,
  "pilot.readiness.view",
  "pilot.import.manage",
] as const;

const sections = [
  {
    title: "Church setup wizard",
    description: "7-step first-time deployment: church info, leadership, ministries, choirs, protocol, services, review.",
    apis: ["GET /api/v1/setup", "POST /api/v1/setup", "GET /api/v1/setup/status"],
    href: "/dashboard/admin/deployment/setup",
  },
  {
    title: "Import center",
    description: "Members, choirs, protocol, ministries, assets, schedules — preview, validate, confirm, cancel.",
    apis: [
      "POST /api/v1/imports",
      "POST /api/v1/imports/:id/confirm",
      "POST /api/v1/imports/:id/cancel",
      "GET /api/v1/imports/:id/results",
    ],
    href: "/dashboard/admin/deployment/imports",
  },
  {
    title: "Reminder dashboard",
    description: "Rehearsal and event reminder jobs, delivery logs, and failures.",
    apis: ["GET /api/v1/reminders/dashboard", "GET /api/v1/deployment/go-live-report"],
    href: "/dashboard/admin/reminders",
  },
  {
    title: "Export center",
    description: "CSV, PDF, and Excel-compatible exports for members, choirs, reports, and more.",
    apis: ["GET /api/v1/pilot/exports", "GET /api/v1/pilot/exports/:type?format=csv|pdf|xlsx"],
    href: "/dashboard/admin/tools#exports",
  },
  {
    title: "Deployment readiness",
    description: "NOT_READY → PARTIAL → READY → PILOT_READY → LIVE_READY scoring.",
    apis: ["GET /api/v1/setup/readiness", "GET /api/v1/setup/status"],
  },
  {
    title: "Demo / training mode",
    description: "Generate sample members, choirs, services, and protocol teams for training.",
    apis: ["POST /api/v1/setup/demo/generate", "GET /api/v1/setup/demo/status"],
  },
  {
    title: "Deployment checklist",
    description: "Operational checklist before go-live.",
    href: "/dashboard/church/intelligence",
  },
] as const;

export default function AdminDeploymentPage() {
  return (
    <ProtectedRoute requiredPermissions={[...DEPLOYMENT_PERMISSIONS]}>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            DEPLOYMENT-READY-1
          </p>
          <h1 className="text-2xl font-semibold">Deployment center</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Install, configure, import, and onboard your church without custom development.
          </p>
        </header>

        <ul className="space-y-4">
          {sections.map((section) => (
            <li key={section.title} className="rounded-lg border p-4">
              <h2 className="font-medium">{section.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{section.description}</p>
              {"apis" in section && section.apis ? (
                <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
                  {section.apis.map((api) => (
                    <li key={api}>{api}</li>
                  ))}
                </ul>
              ) : null}
              {"href" in section && section.href ? (
                <Link
                  href={section.href}
                  className="text-primary mt-3 inline-block text-sm underline"
                >
                  Open
                </Link>
              ) : null}
            </li>
          ))}
        </ul>

        <p className="text-muted-foreground text-xs">
          See <code className="text-foreground">docs/deployment/</code> for setup wizard, import
          completion, mobile portal, and training mode guides.
        </p>
      </div>
    </ProtectedRoute>
  );
}
