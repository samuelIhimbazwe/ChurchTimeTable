import { choirPositionMeta } from '@/lib/constants/choir-positions'

export function ChoirPositionGuide({ roleKey }: { roleKey: string }) {
  const meta = choirPositionMeta(roleKey)
  if (!meta) return null

  return (
    <div className="rounded-lg border border-border bg-surface-raised/50 p-4 space-y-3 text-sm">
      <p className="text-text-secondary leading-relaxed">{meta.summary}</p>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
          Responsibilities
        </p>
        <ul className="list-disc list-inside text-xs text-text-secondary space-y-0.5">
          {meta.responsibilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
          System access (permissions)
        </p>
        <ul className="list-disc list-inside text-xs text-text-secondary space-y-0.5">
          {meta.permissions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">
          Typical actions in the app
        </p>
        <ul className="list-disc list-inside text-xs text-text-secondary space-y-0.5">
          {meta.actions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
