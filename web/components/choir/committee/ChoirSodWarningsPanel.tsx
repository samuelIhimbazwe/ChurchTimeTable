'use client'

import { Card } from '@/components/shared'
import type { ChoirSodWarning } from '@/lib/api/modules/governance'

type Props = {
  warnings: ChoirSodWarning[]
}

export function ChoirSodWarningsPanel({ warnings }: Props) {
  if (warnings.length === 0) return null

  return (
    <Card padding="md" accent="warning" className="space-y-2">
      <p className="text-sm font-semibold text-text-primary">Segregation of duties (SoD)</p>
      <ul className="space-y-2">
        {warnings.map((warning) => (
          <li key={warning.id} className="text-sm text-text-secondary">
            <span
              className={
                warning.severity === 'high'
                  ? 'font-semibold text-danger'
                  : warning.severity === 'medium'
                    ? 'font-semibold text-warning'
                    : 'font-medium text-text-primary'
              }
            >
              {warning.severity === 'high' ? 'High' : warning.severity === 'medium' ? 'Medium' : 'Low'}:
            </span>{' '}
            {warning.message}
          </li>
        ))}
      </ul>
    </Card>
  )
}
