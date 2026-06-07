'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assetsApi, choirOperationsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, PermissionGate, SkeletonCard } from '@/components/shared'
import { ChoirMemberPicker } from '@/components/choir/ChoirMemberPicker'
import { useResolvedChoirScope } from '@/lib/hooks'

type UniformAssignmentRow = {
  id: string
  issuedAt?: string
  item?: { label?: string; size?: string }
  member?: { firstName?: string; lastName?: string }
}

type EquipmentRow = {
  id: string
  name: string
  category?: string
  condition?: string
  assignments?: Array<{
    id: string
    member?: { firstName?: string; lastName?: string }
  }>
}

export function ChoirAssetsManagePanel() {
  const qc = useQueryClient()
  const { choirId } = useResolvedChoirScope()
  const [tab, setTab] = useState<'uniforms' | 'equipment' | 'registry'>('uniforms')

  const { data: uniforms, isLoading: loadingUniforms } = useQuery({
    queryKey: ['choir-uniforms'],
    queryFn: assetsApi.getChoirUniforms,
  })

  const { data: equipment, isLoading: loadingEquipment } = useQuery({
    queryKey: ['choir-equipment'],
    queryFn: assetsApi.getChoirEquipment,
  })

  const { data: uniformTypes } = useQuery({
    queryKey: ['choir-uniform-types'],
    queryFn: choirOperationsApi.getUniformTypes,
    enabled: tab === 'uniforms',
  })

  const { data: categories } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: assetsApi.getCategories,
    enabled: tab === 'registry',
    select: (rows) =>
      (rows as Array<{ id: string; name: string; code?: string }>),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['choir-uniforms'] })
    qc.invalidateQueries({ queryKey: ['choir-equipment'] })
    qc.invalidateQueries({ queryKey: ['assets-all'] })
    qc.invalidateQueries({ queryKey: ['choir-uniform-types'] })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['uniforms', 'equipment', 'registry'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
              tab === id
                ? 'bg-primary-700 text-white border-primary-700'
                : 'border-border text-text-secondary hover:bg-surface-raised'
            }`}
          >
            {id === 'uniforms' ? 'Uniforms' : id === 'equipment' ? 'Equipment' : 'Church registry'}
          </button>
        ))}
      </div>

      {tab === 'uniforms' && (
        <UniformsPanel
          loading={loadingUniforms}
          assignments={(uniforms?.assignments ?? uniforms?.items ?? []) as UniformAssignmentRow[]}
          types={uniformTypes ?? []}
          choirId={choirId}
          onDone={invalidate}
        />
      )}

      {tab === 'equipment' && (
        <EquipmentPanel
          loading={loadingEquipment}
          assets={(equipment?.assets ?? equipment?.items ?? []) as EquipmentRow[]}
          choirId={choirId}
          onDone={invalidate}
        />
      )}

      {tab === 'registry' && (
        <RegistryPanel categories={categories ?? []} onDone={invalidate} />
      )}
    </div>
  )
}

function UniformsPanel({
  loading,
  assignments,
  types,
  choirId,
  onDone,
}: {
  loading: boolean
  assignments: UniformAssignmentRow[]
  types: Array<{ id: string; name: string; code: string }>
  choirId?: string
  onDone: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [typeCode, setTypeCode] = useState('')
  const [typeName, setTypeName] = useState('')
  const [uniformTypeId, setUniformTypeId] = useState('')
  const [label, setLabel] = useState('')
  const [size, setSize] = useState('')
  const [issueItemId, setIssueItemId] = useState('')
  const [issueMemberId, setIssueMemberId] = useState('')

  const createType = useMutation({
    mutationFn: () =>
      choirOperationsApi.createUniformType({
        choirId,
        code: typeCode.trim(),
        name: typeName.trim(),
      }),
    onSuccess: () => {
      toast.success('Uniform type created')
      setTypeCode('')
      setTypeName('')
      onDone()
    },
    onError: () => toast.error('Failed to create uniform type'),
  })

  const createItem = useMutation({
    mutationFn: () =>
      choirOperationsApi.createUniformItem({
        uniformTypeId,
        label: label.trim(),
        size: size.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Uniform item added')
      setLabel('')
      setSize('')
      onDone()
    },
    onError: () => toast.error('Failed to add uniform item'),
  })

  const issue = useMutation({
    mutationFn: () =>
      choirOperationsApi.issueUniform({
        uniformItemId: issueItemId,
        memberId: issueMemberId,
      }),
    onSuccess: () => {
      toast.success('Uniform issued')
      setIssueItemId('')
      setIssueMemberId('')
      onDone()
    },
    onError: () => toast.error('Failed to issue uniform'),
  })

  const returnUniform = useMutation({
    mutationFn: (assignmentId: string) => choirOperationsApi.returnUniform(assignmentId),
    onSuccess: () => {
      toast.success('Uniform returned')
      onDone()
    },
    onError: () => toast.error('Failed to return uniform'),
  })

  if (loading) return <SkeletonCard rows={4} />

  return (
    <div className="space-y-4">
      <PermissionGate anyOf={['choir.uniform.manage', 'choir.ops.manage']}>
        <Card padding="md">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-sm font-semibold text-primary-600"
          >
            {showForm ? 'Hide forms' : '+ Add uniform type / item / issue'}
          </button>
          {showForm && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  placeholder="Type code (e.g. ROBE)"
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
                />
                <input
                  placeholder="Type name"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
                />
              </div>
              <button
                type="button"
                onClick={() => createType.mutate()}
                disabled={!typeCode.trim() || !typeName.trim() || createType.isPending}
                className="px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
              >
                Create type
              </button>

              <div className="grid sm:grid-cols-3 gap-3">
                <select
                  value={uniformTypeId}
                  onChange={(e) => setUniformTypeId(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
                >
                  <option value="">Select type</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <input
                  placeholder="Item label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
                />
                <input
                  placeholder="Size (optional)"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
                />
              </div>
              <button
                type="button"
                onClick={() => createItem.mutate()}
                disabled={!uniformTypeId || !label.trim() || createItem.isPending}
                className="px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
              >
                Add item to inventory
              </button>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-muted">Issue to member</p>
                <input
                  placeholder="Uniform item ID"
                  value={issueItemId}
                  onChange={(e) => setIssueItemId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
                />
                <ChoirMemberPicker
                  value={issueMemberId}
                  onChange={setIssueMemberId}
                  placeholder="Search member to issue uniform"
                />
                <button
                  type="button"
                  onClick={() => issue.mutate()}
                  disabled={!issueItemId || !issueMemberId || issue.isPending}
                  className="px-3 py-1.5 text-xs font-semibold bg-gold-500 text-primary-900 rounded-lg disabled:opacity-60"
                >
                  Issue uniform
                </button>
              </div>
            </div>
          )}
        </Card>
      </PermissionGate>

      <Card padding="none">
        <ul className="divide-y divide-border">
          {assignments.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-text-muted">No active uniform assignments.</li>
          ) : (
            assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {a.item?.label ?? 'Uniform'}
                    {a.item?.size ? ` (${a.item.size})` : ''}
                  </p>
                  <p className="text-xs text-text-muted">
                    {a.member?.firstName} {a.member?.lastName}
                  </p>
                </div>
                <PermissionGate anyOf={['choir.uniform.manage', 'choir.ops.manage']}>
                  <button
                    type="button"
                    onClick={() => returnUniform.mutate(a.id)}
                    disabled={returnUniform.isPending}
                    className="text-xs font-semibold text-primary-600"
                  >
                    Mark returned
                  </button>
                </PermissionGate>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  )
}

function EquipmentPanel({
  loading,
  assets,
  choirId,
  onDone,
}: {
  loading: boolean
  assets: EquipmentRow[]
  choirId?: string
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [assignEquipmentId, setAssignEquipmentId] = useState('')
  const [assignMemberId, setAssignMemberId] = useState('')

  const create = useMutation({
    mutationFn: () =>
      choirOperationsApi.createEquipment({
        choirId,
        name: name.trim(),
        category: category.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Equipment added')
      setName('')
      setCategory('')
      onDone()
    },
    onError: () => toast.error('Failed to add equipment'),
  })

  const assign = useMutation({
    mutationFn: () =>
      choirOperationsApi.assignEquipment(assignEquipmentId, { memberId: assignMemberId }),
    onSuccess: () => {
      toast.success('Equipment assigned')
      setAssignEquipmentId('')
      setAssignMemberId('')
      onDone()
    },
    onError: () => toast.error('Failed to assign equipment'),
  })

  const returnEquipment = useMutation({
    mutationFn: (assignmentId: string) => choirOperationsApi.returnEquipment(assignmentId),
    onSuccess: () => {
      toast.success('Equipment returned')
      onDone()
    },
    onError: () => toast.error('Failed to return equipment'),
  })

  if (loading) return <SkeletonCard rows={4} />

  return (
    <div className="space-y-4">
      <PermissionGate anyOf={['choir.equipment.manage', 'choir.ops.manage']}>
        <Card padding="md">
          <p className="text-sm font-semibold mb-3">Add equipment</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
            <input
              placeholder="Category (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
          </div>
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={!name.trim() || create.isPending}
            className="mt-3 px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
          >
            Add equipment
          </button>

          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-text-muted">Assign to member</p>
            <input
              placeholder="Equipment ID"
              value={assignEquipmentId}
              onChange={(e) => setAssignEquipmentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface"
            />
            <ChoirMemberPicker
              value={assignMemberId}
              onChange={setAssignMemberId}
              placeholder="Search member"
            />
            <button
              type="button"
              onClick={() => assign.mutate()}
              disabled={!assignEquipmentId || !assignMemberId || assign.isPending}
              className="px-3 py-1.5 text-xs font-semibold bg-gold-500 text-primary-900 rounded-lg disabled:opacity-60"
            >
              Assign equipment
            </button>
          </div>
        </Card>
      </PermissionGate>

      <Card padding="none">
        <ul className="divide-y divide-border">
          {assets.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-text-muted">No equipment listed.</li>
          ) : (
            assets.map((a) => {
              const active = a.assignments?.[0]
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-text-muted">
                      {[a.category, a.condition].filter(Boolean).join(' · ')}
                      {active?.member && (
                        <> · Assigned to {active.member.firstName} {active.member.lastName}</>
                      )}
                    </p>
                    <p className="text-xs text-text-muted font-mono mt-0.5">{a.id}</p>
                  </div>
                  {active && (
                    <PermissionGate anyOf={['choir.equipment.manage', 'choir.ops.manage']}>
                      <button
                        type="button"
                        onClick={() => returnEquipment.mutate(active.id)}
                        disabled={returnEquipment.isPending}
                        className="text-xs font-semibold text-primary-600"
                      >
                        Return
                      </button>
                    </PermissionGate>
                  )}
                </li>
              )
            })
          )}
        </ul>
      </Card>
    </div>
  )
}

function RegistryPanel({
  categories,
  onDone,
}: {
  categories: Array<{ id: string; name: string; code?: string }>
  onDone: () => void
}) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const create = useMutation({
    mutationFn: () =>
      assetsApi.create({
        code: code.trim(),
        name: name.trim(),
        categoryId,
      }),
    onSuccess: () => {
      toast.success('Asset registered')
      setCode('')
      setName('')
      onDone()
    },
    onError: () => toast.error('Failed to register asset'),
  })

  return (
    <PermissionGate anyOf={['asset:create', 'asset:manage']}>
      <Card padding="md">
        <p className="text-sm font-semibold mb-3">Register church asset</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            placeholder="Asset code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <input
            placeholder="Asset name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => create.mutate()}
          disabled={!code.trim() || !name.trim() || !categoryId || create.isPending}
          className="mt-3 px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
        >
          Register asset
        </button>
      </Card>
    </PermissionGate>
  )
}
