'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  contributionsApi,
  type ContributionCampaignAdminItem,
  type ContributionCatalogAdminItem,
} from '@/lib/api'
import { toast } from '@/components/shared/Toast'
import { Card, Badge } from '@/components/shared'
import { formatCurrency, formatDate } from '@/lib/utils/format'

const CAMPAIGN_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] as const

export function ContributionCatalogAdminPanel({ choirId }: { choirId: string }) {
  const qc = useQueryClient()
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSortOrder, setNewSortOrder] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [campaignDesc, setCampaignDesc] = useState('')
  const [campaignGoal, setCampaignGoal] = useState('')
  const [campaignMemberGoal, setCampaignMemberGoal] = useState('')
  const [campaignFamilyGoal, setCampaignFamilyGoal] = useState('')
  const [campaignTypeId, setCampaignTypeId] = useState('')
  const [campaignStart, setCampaignStart] = useState('')
  const [campaignEnd, setCampaignEnd] = useState('')

  const { data: catalog, isLoading: loadingCatalog } = useQuery({
    queryKey: ['contribution-admin-catalog', choirId],
    queryFn: () => contributionsApi.listAdminCatalog(choirId),
  })

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['contribution-admin-campaigns', choirId],
    queryFn: () => contributionsApi.listAdminCampaigns(choirId),
  })

  const types = catalog?.items ?? []
  const campaignItems = campaigns?.items ?? []

  const createType = useMutation({
    mutationFn: () =>
      contributionsApi.createAdminCatalog(choirId, {
        code: newCode.trim(),
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        sortOrder: newSortOrder ? Number(newSortOrder) : undefined,
      }),
    onSuccess: () => {
      toast.success('Contribution type added')
      setNewCode('')
      setNewName('')
      setNewDesc('')
      setNewSortOrder('')
      qc.invalidateQueries({ queryKey: ['contribution-admin-catalog', choirId] })
    },
    onError: (err: Error) => toast.error('Could not add type', err.message),
  })

  const toggleType = useMutation({
    mutationFn: (row: ContributionCatalogAdminItem) =>
      contributionsApi.updateAdminCatalog(row.id, { active: !row.active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contribution-admin-catalog', choirId] })
    },
    onError: (err: Error) => toast.error('Could not update type', err.message),
  })

  const createCampaign = useMutation({
    mutationFn: () =>
      contributionsApi.createAdminCampaign(choirId, {
        contributionTypeCatalogId: campaignTypeId,
        name: campaignName.trim(),
        goalAmount: parseFloat(campaignGoal),
        description: campaignDesc.trim() || undefined,
        periodStart: campaignStart || undefined,
        periodEnd: campaignEnd || undefined,
        memberGoalAmount: campaignMemberGoal
          ? parseFloat(campaignMemberGoal)
          : undefined,
        familyGoalAmount: campaignFamilyGoal
          ? parseFloat(campaignFamilyGoal)
          : undefined,
        status: 'ACTIVE',
      }),
    onSuccess: () => {
      toast.success('Campaign created')
      setCampaignName('')
      setCampaignDesc('')
      setCampaignGoal('')
      setCampaignMemberGoal('')
      setCampaignFamilyGoal('')
      setCampaignStart('')
      setCampaignEnd('')
      qc.invalidateQueries({ queryKey: ['contribution-admin-campaigns', choirId] })
    },
    onError: (err: Error) => toast.error('Could not create campaign', err.message),
  })

  const updateCampaignStatus = useMutation({
    mutationFn: ({
      row,
      status,
    }: {
      row: ContributionCampaignAdminItem
      status: (typeof CAMPAIGN_STATUSES)[number]
    }) => contributionsApi.updateAdminCampaign(row.id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contribution-admin-campaigns', choirId] })
    },
    onError: (err: Error) => toast.error('Could not update campaign', err.message),
  })

  return (
    <div className="space-y-6">
      <Card padding="md">
        <p className="font-semibold text-text-primary">Contribution types</p>
        <p className="text-xs text-text-muted mt-1 mb-4">
          Catalog entries members see when submitting claims.
        </p>
        {loadingCatalog ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : (
          <ul className="divide-y divide-border mb-4">
            {types.map((row) => (
              <li key={row.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{row.name}</p>
                  <p className="text-xs text-text-muted">{row.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={row.active ? 'status-present' : 'default'}>
                    {row.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => toggleType.mutate(row)}
                    className="text-xs font-semibold text-primary-600"
                  >
                    {row.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Code (e.g. easter_drive)"
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Display name"
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <input
            value={newSortOrder}
            onChange={(e) => setNewSortOrder(e.target.value)}
            placeholder="Sort order"
            type="number"
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <button
            type="button"
            onClick={() => createType.mutate()}
            disabled={createType.isPending || !newCode.trim() || !newName.trim()}
            className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
          >
            Add type
          </button>
        </div>
      </Card>

      <Card padding="md">
        <p className="font-semibold text-text-primary">Fundraising campaigns</p>
        <p className="text-xs text-text-muted mt-1 mb-4">
          Active campaigns appear on member submit forms and stewardship totals.
        </p>
        {loadingCampaigns ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : campaignItems.length === 0 ? (
          <p className="text-sm text-text-muted mb-4">No campaigns yet.</p>
        ) : (
          <ul className="divide-y divide-border mb-4">
            {campaignItems.map((row) => {
              const typeName = types.find((t) => t.id === row.contributionTypeCatalogId)?.name
              return (
                <li key={row.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{row.name}</p>
                    <p className="text-xs text-text-muted">
                      {typeName && <>{typeName} · </>}
                      Choir goal {formatCurrency(row.goalAmount)}
                      {row.memberGoalAmount != null && (
                        <> · Member {formatCurrency(row.memberGoalAmount)}</>
                      )}
                      {row.familyGoalAmount != null && (
                        <> · Family {formatCurrency(row.familyGoalAmount)}</>
                      )}
                      {row.periodEnd && <> · ends {formatDate(row.periodEnd)}</>}
                    </p>
                  </div>
                  <select
                    value={row.status}
                    onChange={(e) =>
                      updateCampaignStatus.mutate({
                        row,
                        status: e.target.value as (typeof CAMPAIGN_STATUSES)[number],
                      })
                    }
                    className="text-xs px-2 py-1 rounded border border-border bg-surface"
                  >
                    {CAMPAIGN_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </li>
              )
            })}
          </ul>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <select
            value={campaignTypeId}
            onChange={(e) => setCampaignTypeId(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          >
            <option value="">Contribution type…</option>
            {types.filter((t) => t.active).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Campaign name"
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <input
            type="number"
            value={campaignGoal}
            onChange={(e) => setCampaignGoal(e.target.value)}
            placeholder="Choir goal (RWF)"
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <input
            type="number"
            value={campaignMemberGoal}
            onChange={(e) => setCampaignMemberGoal(e.target.value)}
            placeholder="Member target (RWF)"
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <input
            type="number"
            value={campaignFamilyGoal}
            onChange={(e) => setCampaignFamilyGoal(e.target.value)}
            placeholder="Family goal (RWF)"
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <button
            type="button"
            onClick={() => createCampaign.mutate()}
            disabled={
              createCampaign.isPending ||
              !campaignTypeId ||
              !campaignName.trim() ||
              !campaignGoal ||
              parseFloat(campaignGoal) <= 0
            }
            className="px-4 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg disabled:opacity-60"
          >
            Create campaign
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <input
            value={campaignDesc}
            onChange={(e) => setCampaignDesc(e.target.value)}
            placeholder="Campaign description (optional)"
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <input
            type="date"
            value={campaignStart}
            onChange={(e) => setCampaignStart(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
          <input
            type="date"
            value={campaignEnd}
            onChange={(e) => setCampaignEnd(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border border-border bg-surface"
          />
        </div>
      </Card>
    </div>
  )
}
