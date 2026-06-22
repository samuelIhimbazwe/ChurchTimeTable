'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assetsApi, choirOperationsApi } from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, CapabilityGate, PermissionGate, SkeletonCard, EmptyState } from '@/components/shared'
import { FormField, Input, Select, Textarea } from '@/components/shared/form'
import {
  maintenanceLogFormSchema,
  uniformTypeFormSchema,
  uniformItemFormSchema,
  uniformIssueFormSchema,
  equipmentFormSchema,
  equipmentAssignFormSchema,
  assetRegistryFormSchema,
  type MaintenanceLogFormValues,
  type AssetRegistryFormValues,
} from '@/lib/validation/schemas'
import { ChoirMemberPicker } from '@/components/choir/ChoirMemberPicker'
import { useResolvedChoirScope } from '@/lib/hooks'
import { Shirt, Wrench } from 'lucide-react'

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
  const [tab, setTab] = useState<'uniforms' | 'equipment' | 'registry' | 'maintenance'>('uniforms')

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
        {(['uniforms', 'equipment', 'registry', 'maintenance'] as const).map((id) => (
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
            {id === 'uniforms'
              ? 'Uniforms'
              : id === 'equipment'
                ? 'Equipment'
                : id === 'registry'
                  ? 'Church registry'
                  : 'Maintenance'}
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

      {tab === 'maintenance' && <MaintenancePanel onDone={invalidate} />}
    </div>
  )
}

function MaintenancePanel({ onDone }: { onDone: () => void }) {
  const form = useForm<MaintenanceLogFormValues>({
    resolver: zodResolver(maintenanceLogFormSchema),
    defaultValues: {
      assetId: '',
      type: 'SERVICE',
      description: '',
      nextMaintenanceDate: '',
    },
  })

  const assetId = form.watch('assetId')
  const { errors } = form.formState

  const { data: upcoming } = useQuery({
    queryKey: ['asset-maintenance-upcoming'],
    queryFn: () => assetsApi.getMaintenanceUpcoming(),
  })

  const { data: overdue } = useQuery({
    queryKey: ['asset-maintenance-overdue'],
    queryFn: () => assetsApi.getMaintenanceOverdue(),
  })

  const { data: assets } = useQuery({
    queryKey: ['assets-all'],
    queryFn: () => assetsApi.getAll({ limit: 100 }),
  })

  const { data: history } = useQuery({
    queryKey: ['asset-maintenance-history', assetId],
    queryFn: () => assetsApi.getMaintenanceHistory(assetId),
    enabled: !!assetId,
  })

  const create = useMutation({
    mutationFn: (data: MaintenanceLogFormValues) =>
      assetsApi.createMaintenance(data.assetId, {
        type: data.type,
        description: data.description.trim(),
        nextMaintenanceDate: data.nextMaintenanceDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Maintenance logged')
      form.reset({ assetId: '', type: 'SERVICE', description: '', nextMaintenanceDate: '' })
      onDone()
    },
    onError: () => toast.error('Could not log maintenance'),
  })

  const assetItems = assets?.items ?? []

  return (
    <div className="space-y-4">
      {(overdue?.length ?? 0) > 0 && (
        <Card padding="md" accent="warning">
          <p className="text-sm font-semibold text-text-primary mb-2">Overdue maintenance</p>
          <ul className="text-xs text-text-secondary space-y-1">
            {overdue!.slice(0, 5).map((row) => (
              <li key={row.id}>
                {row.asset?.name ?? 'Asset'} — {row.description}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padding="md">
        <p className="text-sm font-semibold text-text-primary mb-3">Log maintenance</p>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit((data) => create.mutate(data))}
        >
          <FormField label="Asset" required error={errors.assetId?.message}>
            <Select {...form.register('assetId')} error={!!errors.assetId}>
              <option value="">Select asset…</option>
              {assetItems.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Maintenance type" error={errors.type?.message}>
            <Select {...form.register('type')}>
              <option value="SERVICE">Service</option>
              <option value="REPAIR">Repair</option>
              <option value="INSPECTION">Inspection</option>
              <option value="UPGRADE">Upgrade</option>
            </Select>
          </FormField>
          <FormField label="Description" required error={errors.description?.message}>
            <Input {...form.register('description')} placeholder="What was done?" error={!!errors.description} />
          </FormField>
          <FormField label="Next maintenance date" hint="Optional reminder date.">
            <Input type="date" {...form.register('nextMaintenanceDate')} />
          </FormField>
          <button
            type="submit"
            disabled={create.isPending}
            className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
          >
            {create.isPending ? 'Saving…' : 'Log maintenance'}
          </button>
        </form>
      </Card>

      {assetId && (history?.length ?? 0) > 0 && (
        <Card padding="md">
          <p className="text-sm font-semibold text-text-primary mb-2">History</p>
          <ul className="text-xs text-text-muted space-y-2">
            {history!.map((row) => (
              <li key={row.id}>
                {row.type} — {row.description}
                {row.nextMaintenanceDate && (
                  <> · next {new Date(row.nextMaintenanceDate).toLocaleDateString()}</>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(upcoming?.length ?? 0) > 0 && (
        <Card padding="md">
          <p className="text-sm font-semibold text-text-primary mb-2">Upcoming (30 days)</p>
          <ul className="text-xs text-text-muted space-y-1">
            {upcoming!.slice(0, 8).map((row) => (
              <li key={row.id}>
                {row.asset?.name ?? 'Asset'} — {row.description}
              </li>
            ))}
          </ul>
        </Card>
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

  const typeForm = useForm({
    resolver: zodResolver(uniformTypeFormSchema),
    defaultValues: { typeCode: '', typeName: '' },
  })
  const itemForm = useForm({
    resolver: zodResolver(uniformItemFormSchema),
    defaultValues: { uniformTypeId: '', label: '', size: '' },
  })
  const issueForm = useForm({
    resolver: zodResolver(uniformIssueFormSchema),
    defaultValues: { issueItemId: '', issueMemberId: '' },
  })

  const issueMemberId = issueForm.watch('issueMemberId')

  const createType = useMutation({
    mutationFn: (data: { typeCode: string; typeName: string }) =>
      choirOperationsApi.createUniformType({
        choirId,
        code: data.typeCode.trim(),
        name: data.typeName.trim(),
      }),
    onSuccess: () => {
      toast.success('Uniform type created')
      typeForm.reset()
      onDone()
    },
    onError: () => toast.error('Failed to create uniform type'),
  })

  const createItem = useMutation({
    mutationFn: (data: { uniformTypeId: string; label: string; size?: string }) =>
      choirOperationsApi.createUniformItem({
        uniformTypeId: data.uniformTypeId,
        label: data.label.trim(),
        size: data.size?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Uniform item added')
      itemForm.reset({ uniformTypeId: '', label: '', size: '' })
      onDone()
    },
    onError: () => toast.error('Failed to add uniform item'),
  })

  const issue = useMutation({
    mutationFn: (data: { issueItemId: string; issueMemberId: string }) =>
      choirOperationsApi.issueUniform({
        uniformItemId: data.issueItemId,
        memberId: data.issueMemberId,
      }),
    onSuccess: () => {
      toast.success('Uniform issued')
      issueForm.reset({ issueItemId: '', issueMemberId: '' })
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
      <CapabilityGate uiCapability="logistics-uniform-manage">
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
              <form
                className="space-y-3"
                onSubmit={typeForm.handleSubmit((data) => createType.mutate(data))}
              >
                <p className="text-xs font-semibold text-text-muted">New uniform type</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <FormField label="Code" required error={typeForm.formState.errors.typeCode?.message}>
                    <Input {...typeForm.register('typeCode')} placeholder="e.g. ROBE" error={!!typeForm.formState.errors.typeCode} />
                  </FormField>
                  <FormField label="Name" required error={typeForm.formState.errors.typeName?.message}>
                    <Input {...typeForm.register('typeName')} placeholder="Type name" error={!!typeForm.formState.errors.typeName} />
                  </FormField>
                </div>
                <button
                  type="submit"
                  disabled={createType.isPending}
                  className="px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
                >
                  Create type
                </button>
              </form>

              <form
                className="space-y-3 border-t border-border pt-4"
                onSubmit={itemForm.handleSubmit((data) => createItem.mutate(data))}
              >
                <p className="text-xs font-semibold text-text-muted">Add inventory item</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <FormField label="Type" required error={itemForm.formState.errors.uniformTypeId?.message}>
                    <Select {...itemForm.register('uniformTypeId')} error={!!itemForm.formState.errors.uniformTypeId}>
                      <option value="">Select type</option>
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Label" required error={itemForm.formState.errors.label?.message}>
                    <Input {...itemForm.register('label')} placeholder="Item label" error={!!itemForm.formState.errors.label} />
                  </FormField>
                  <FormField label="Size" hint="Optional">
                    <Input {...itemForm.register('size')} placeholder="Size" />
                  </FormField>
                </div>
                <button
                  type="submit"
                  disabled={createItem.isPending}
                  className="px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
                >
                  Add item to inventory
                </button>
              </form>

              <form
                className="space-y-2 border-t border-border pt-4"
                onSubmit={issueForm.handleSubmit((data) => issue.mutate(data))}
              >
                <p className="text-xs font-semibold text-text-muted">Issue to member</p>
                <FormField label="Uniform item ID" required error={issueForm.formState.errors.issueItemId?.message}>
                  <Input {...issueForm.register('issueItemId')} placeholder="Uniform item ID" error={!!issueForm.formState.errors.issueItemId} />
                </FormField>
                <FormField label="Member" required error={issueForm.formState.errors.issueMemberId?.message}>
                  <ChoirMemberPicker
                    value={issueMemberId}
                    onChange={(id) => issueForm.setValue('issueMemberId', id, { shouldValidate: true })}
                    placeholder="Search member to issue uniform"
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={issue.isPending}
                  className="px-3 py-1.5 text-xs font-semibold bg-gold-500 text-primary-900 rounded-lg disabled:opacity-60"
                >
                  Issue uniform
                </button>
              </form>
            </div>
          )}
        </Card>
      </CapabilityGate>

      <Card padding="none">
        <ul className="divide-y divide-border">
          {assignments.length === 0 ? (
            <li className="px-5 py-4">
              <EmptyState
                icon={Shirt}
                title="No active uniform assignments"
                description="Issue uniforms from the forms above when inventory is ready."
                className="py-6"
              />
            </li>
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
                <CapabilityGate uiCapability="logistics-uniform-manage">
                  <button
                    type="button"
                    onClick={() => returnUniform.mutate(a.id)}
                    disabled={returnUniform.isPending}
                    className="text-xs font-semibold text-primary-600"
                  >
                    Mark returned
                  </button>
                </CapabilityGate>
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
  const equipForm = useForm({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: { name: '', category: '' },
  })
  const assignForm = useForm({
    resolver: zodResolver(equipmentAssignFormSchema),
    defaultValues: { assignEquipmentId: '', assignMemberId: '' },
  })

  const assignMemberId = assignForm.watch('assignMemberId')

  const create = useMutation({
    mutationFn: (data: { name: string; category?: string }) =>
      choirOperationsApi.createEquipment({
        choirId,
        name: data.name.trim(),
        category: data.category?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Equipment added')
      equipForm.reset()
      onDone()
    },
    onError: () => toast.error('Failed to add equipment'),
  })

  const assign = useMutation({
    mutationFn: (data: { assignEquipmentId: string; assignMemberId: string }) =>
      choirOperationsApi.assignEquipment(data.assignEquipmentId, { memberId: data.assignMemberId }),
    onSuccess: () => {
      toast.success('Equipment assigned')
      assignForm.reset({ assignEquipmentId: '', assignMemberId: '' })
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
      <CapabilityGate uiCapability="logistics-equipment-manage">
        <Card padding="md">
          <form
            className="space-y-3"
            onSubmit={equipForm.handleSubmit((data) => create.mutate(data))}
          >
            <p className="text-sm font-semibold mb-1">Add equipment</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <FormField label="Name" required error={equipForm.formState.errors.name?.message}>
                <Input {...equipForm.register('name')} placeholder="Name" error={!!equipForm.formState.errors.name} />
              </FormField>
              <FormField label="Category" hint="Optional">
                <Input {...equipForm.register('category')} placeholder="Category" />
              </FormField>
            </div>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
            >
              Add equipment
            </button>
          </form>

          <form
            className="mt-4 pt-4 border-t border-border space-y-2"
            onSubmit={assignForm.handleSubmit((data) => assign.mutate(data))}
          >
            <p className="text-xs font-semibold text-text-muted">Assign to member</p>
            <FormField label="Equipment ID" required error={assignForm.formState.errors.assignEquipmentId?.message}>
              <Input {...assignForm.register('assignEquipmentId')} placeholder="Equipment ID" error={!!assignForm.formState.errors.assignEquipmentId} />
            </FormField>
            <FormField label="Member" required error={assignForm.formState.errors.assignMemberId?.message}>
              <ChoirMemberPicker
                value={assignMemberId}
                onChange={(id) => assignForm.setValue('assignMemberId', id, { shouldValidate: true })}
                placeholder="Search member"
              />
            </FormField>
            <button
              type="submit"
              disabled={assign.isPending}
              className="px-3 py-1.5 text-xs font-semibold bg-gold-500 text-primary-900 rounded-lg disabled:opacity-60"
            >
              Assign equipment
            </button>
          </form>
        </Card>
      </CapabilityGate>

      <Card padding="none">
        <ul className="divide-y divide-border">
          {assets.length === 0 ? (
            <li className="px-5 py-4">
              <EmptyState
                icon={Wrench}
                title="No equipment listed"
                description="Add equipment above, then assign items to members as needed."
                className="py-6"
              />
            </li>
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
                    <CapabilityGate uiCapability="logistics-equipment-manage">
                      <button
                        type="button"
                        onClick={() => returnEquipment.mutate(active.id)}
                        disabled={returnEquipment.isPending}
                        className="text-xs font-semibold text-primary-600"
                      >
                        Return
                      </button>
                    </CapabilityGate>
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
  const form = useForm<AssetRegistryFormValues>({
    resolver: zodResolver(assetRegistryFormSchema),
    defaultValues: { code: '', name: '', categoryId: '' },
  })

  const create = useMutation({
    mutationFn: (data: AssetRegistryFormValues) =>
      assetsApi.create({
        code: data.code.trim(),
        name: data.name.trim(),
        categoryId: data.categoryId,
      }),
    onSuccess: () => {
      toast.success('Asset registered')
      form.reset()
      onDone()
    },
    onError: () => toast.error('Failed to register asset'),
  })

  return (
    <PermissionGate anyOf={['asset:create', 'asset:manage']}>
      <Card padding="md">
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit((data) => create.mutate(data))}
        >
          <p className="text-sm font-semibold mb-1">Register church asset</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <FormField label="Code" required error={form.formState.errors.code?.message}>
              <Input {...form.register('code')} placeholder="Asset code" error={!!form.formState.errors.code} />
            </FormField>
            <FormField label="Name" required error={form.formState.errors.name?.message}>
              <Input {...form.register('name')} placeholder="Asset name" error={!!form.formState.errors.name} />
            </FormField>
            <FormField label="Category" required error={form.formState.errors.categoryId?.message}>
              <Select {...form.register('categoryId')} error={!!form.formState.errors.categoryId}>
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <button
            type="submit"
            disabled={create.isPending}
            className="px-3 py-1.5 text-xs font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
          >
            Register asset
          </button>
        </form>
      </Card>
    </PermissionGate>
  )
}
