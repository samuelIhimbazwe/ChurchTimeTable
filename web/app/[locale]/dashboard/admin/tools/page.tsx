import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PLATFORM_ADMIN_VIEW_PERMISSIONS } from "@/core/auth/governance-permissions";

const PILOT_TOOLS_PERMISSIONS = [
  ...PLATFORM_ADMIN_VIEW_PERMISSIONS,
  "pilot.readiness.view",
  "pilot.import.manage",
] as const;

const tools = [
  {
    title: "Deployment center",
    description: "Setup wizard, readiness score, demo mode, and go-live checklist.",
    href: "/dashboard/admin/deployment",
    api: "GET /api/v1/setup/status",
  },
  {
    title: "Data imports",
    description: "Preview and confirm CSV member imports.",
    href: "/dashboard/admin/tools#imports",
    api: "POST /api/v1/imports",
  },
  {
    title: "Export center",
    description: "Download members and choirs as CSV.",
    href: "/dashboard/admin/tools#exports",
    api: "GET /api/v1/pilot/exports",
  },
  {
    title: "Data quality",
    description: "Missing phones, duplicates, leadership gaps.",
    href: "/dashboard/admin/tools#quality",
    api: "GET /api/v1/system/data-quality",
  },
  {
    title: "Permission audit",
    description: "Role permission verification report.",
    href: "/dashboard/admin/tools#permissions",
    api: "GET /api/v1/pilot/permission-audit",
  },
  {
    title: "Workflow simulation",
    description: "Automated schedule, choir, protocol, and broadcast checks.",
    href: "/dashboard/admin/tools#simulation",
    api: "POST /api/v1/pilot/simulations/run",
  },
  {
    title: "System readiness",
    description: "Pilot readiness indicators and MF-6 dashboard.",
    href: "/dashboard/church/intelligence",
    api: "GET /api/v1/system/pilot-readiness",
  },
] as const;

export default function AdminToolsPage() {
  return (
    <ProtectedRoute requiredPermissions={[...PILOT_TOOLS_PERMISSIONS]}>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-semibold">Admin tools</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pilot deployment utilities — imports, exports, quality, permissions,
            and readiness.
          </p>
        </header>
        <ul className="space-y-4">
          {tools.map((tool) => (
            <li
              key={tool.title}
              id={tool.title.toLowerCase().replace(/\s+/g, "-")}
              className="rounded-lg border p-4"
            >
              <h2 className="font-medium">{tool.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {tool.description}
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {tool.api}
              </p>
              {tool.href.startsWith("/dashboard/church") ? (
                <Link
                  href={tool.href}
                  className="text-primary mt-3 inline-block text-sm underline"
                >
                  Open church intelligence
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </ProtectedRoute>
  );
}
