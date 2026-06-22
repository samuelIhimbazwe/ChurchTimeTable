'use client'

import { useQuery } from '@tanstack/react-query'
import { assetsApi } from '@/lib/api'
import {
  Card, CardHeader, CardTitle, CardDescription,
  StatTile, Badge, SkeletonStatTile, SkeletonCard, EmptyState, CapabilityGate,
} from '@/components/shared'
import { useResolvedChoirScope } from '@/lib/hooks'
import { Package, Shirt, Wrench } from 'lucide-react'
import { ChoirAssetsManagePanel } from '@/components/choir/ChoirAssetsManagePanel'

function num(data: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!data) return 0
  for (const k of keys) {
    if (data[k] != null) return Number(data[k])
  }
  return 0
}

function items(data: Record<string, unknown> | undefined, ...keys: string[]) {
  if (!data) return []
  for (const k of keys) {
    const v = data[k]
    if (Array.isArray(v)) return v as Record<string, unknown>[]
  }
  return []
}

export default function AssetsPage() {
  const { choirLink } = useResolvedChoirScope()
  const { data: equipment, isLoading: eqLoading } = useQuery({
    queryKey: ['choir-equipment'],
    queryFn:  assetsApi.getChoirEquipment,
  })

  const { data: uniforms, isLoading: unLoading } = useQuery({
    queryKey: ['choir-uniforms'],
    queryFn:  assetsApi.getChoirUniforms,
  })

  const { data: allAssets, isLoading: allLoading } = useQuery({
    queryKey: ['assets-all'],
    queryFn:  () => assetsApi.getAll({ limit: 50 }),
  })

  const eq = equipment as Record<string, unknown> | undefined
  const un = uniforms as Record<string, unknown> | undefined

  return (
    <CapabilityGate
      uiCapability="logistics-assets-hub"
      fallback={
        <EmptyState
          title="Assets not available"
          description="You do not have permission to view choir assets."
        />
      }
    >
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Assets</h2>
        <p className="text-text-secondary text-sm mt-1">Equipment, uniforms, and inventory</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {eqLoading || unLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonStatTile key={i} />)
        ) : (
          <>
            <StatTile label="Equipment Items" value={num(eq, 'total', 'totalItems', 'count')} icon={Wrench} animate href={choirLink('assets')} />
            <StatTile label="Uniforms"        value={num(un, 'total', 'totalItems', 'count')} icon={Shirt} animate href={choirLink('assets')} />
            <StatTile label="All Assets"      value={allAssets?.total ?? allAssets?.items?.length ?? 0} icon={Package} animate href={choirLink('records')} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <CardTitle>Equipment</CardTitle>
            <CardDescription>Choir equipment dashboard</CardDescription>
          </CardHeader>
          {eqLoading ? (
            <SkeletonCard rows={3} />
          ) : items(eq, 'items', 'equipment', 'recent').length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No equipment listed"
              description="Add equipment in the management panel below."
              className="py-8"
            />
          ) : (
            <AssetList items={items(eq, 'items', 'equipment', 'recent')} />
          )}
        </Card>

        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <CardTitle>Uniforms</CardTitle>
            <CardDescription>Uniform inventory</CardDescription>
          </CardHeader>
          {unLoading ? (
            <SkeletonCard rows={3} />
          ) : items(un, 'items', 'uniforms', 'recent').length === 0 ? (
            <EmptyState
              icon={Shirt}
              title="No uniforms listed"
              description="Create uniform types and issue items in the panel below."
              className="py-8"
            />
          ) : (
            <AssetList items={items(un, 'items', 'uniforms', 'recent')} />
          )}
        </Card>
      </div>

      <ChoirAssetsManagePanel />

      <Card padding="none">
        <CardHeader className="px-5 pt-5">
          <CardTitle>All Assets</CardTitle>
          <CardDescription>Church-wide asset registry</CardDescription>
        </CardHeader>
        {allLoading ? (
          <SkeletonCard rows={4} />
        ) : (allAssets?.items?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Package}
            title="No assets in registry"
            description="Register church-wide assets in the management panel."
            className="py-8"
          />
        ) : (
          <ul className="divide-y divide-border">
            {allAssets?.items?.map((a) => (
              <li key={a.id} className="flex items-center gap-4 px-5 py-3">
                <Package size={16} className="text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{a.name}</p>
                  <p className="text-xs text-text-muted">
                    {[a.category, a.location, a.assignedTo].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {a.status != null && <Badge variant="default">{String(a.status)}</Badge>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
    </CapabilityGate>
  )
}

function AssetList({ items: rows }: { items: Record<string, unknown>[] }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((a, i) => (
        <li key={String(a.id ?? i)} className="flex items-center gap-4 px-5 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {String(a.name ?? a.title ?? 'Item')}
            </p>
            <p className="text-xs text-text-muted">
              {[a.category, a.condition, a.status].filter(Boolean).map(String).join(' · ')}
            </p>
          </div>
          {a.status != null && <Badge variant="default">{String(a.status)}</Badge>}
        </li>
      ))}
    </ul>
  )
}
