import { SkeletonCard, SkeletonStatTile } from '@/components/shared'

export function RouteLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-page-enter" aria-busy="true" aria-label="Loading page">
      <div className="h-9 w-48 rounded-lg bg-surface-overlay animate-skeleton-pulse" />
      <div className="h-4 w-72 max-w-full rounded bg-surface-overlay animate-skeleton-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatTile key={i} />
        ))}
      </div>
      <SkeletonCard rows={6} />
    </div>
  )
}
