'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { setupApi, ministriesApi } from '@/lib/api'
import { FormWizard } from '@/components/shared/form/FormWizard'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/shared'
import { FormField, Input, Textarea } from '@/components/shared/form'
import { toast } from '@/components/shared/Toast'
import { CheckCircle2 } from 'lucide-react'

const WIZARD_STEPS = [
  { id: 'churchInfo', title: 'Church' },
  { id: 'leadership', title: 'Leadership' },
  { id: 'ministries', title: 'Ministries' },
  { id: 'choirs', title: 'Choirs' },
  { id: 'protocol', title: 'Protocol' },
  { id: 'services', title: 'Services' },
  { id: 'review', title: 'Review' },
]

type ChurchInfo = {
  name: string
  city: string
  country: string
  contactEmail: string
  contactPhone: string
}

type Leadership = {
  pastorName: string
  adminEmail: string
  notes: string
}

type ProtocolRules = {
  maxPerService: string
  monthlyQuota: string
}

type ServicesConfig = {
  sundayName: string
  sundayTime: string
}

function jsonField<T>(raw: unknown, fallback: T): T {
  if (raw && typeof raw === 'object') return raw as T
  return fallback
}

export function ChurchSetupWizard() {
  const qc = useQueryClient()
  const [step, setStep] = useState(0)

  const { data: setup } = useQuery({
    queryKey: ['setup'],
    queryFn: setupApi.getSetup,
  })

  const { data: status } = useQuery({
    queryKey: ['setup-status'],
    queryFn: setupApi.getStatus,
  })

  const { data: ministries } = useQuery({
    queryKey: ['ministries'],
    queryFn: ministriesApi.getAll,
  })

  const setupConfig = setup?.config as Record<string, unknown> | undefined
  const setupConfigKey = useMemo(
    () => (setupConfig ? JSON.stringify(setupConfig) : null),
    [setupConfig],
  )

  const [churchInfo, setChurchInfo] = useState<ChurchInfo>({
    name: '',
    city: '',
    country: '',
    contactEmail: '',
    contactPhone: '',
  })
  const [leadership, setLeadership] = useState<Leadership>({
    pastorName: '',
    adminEmail: '',
    notes: '',
  })
  const [ministryActive, setMinistryActive] = useState<Record<string, boolean>>({})
  const [mainChoirName, setMainChoirName] = useState('Main Choir')
  const [protocol, setProtocol] = useState<ProtocolRules>({
    maxPerService: '12',
    monthlyQuota: '3',
  })
  const [services, setServices] = useState<ServicesConfig>({
    sundayName: 'Sunday Worship',
    sundayTime: '09:00',
  })

  useEffect(() => {
    if (!setupConfigKey) return
    const setupConfig = JSON.parse(setupConfigKey) as Record<string, unknown>

    const ci = jsonField<Partial<ChurchInfo>>(setupConfig.churchInfo, {})
    setChurchInfo((prev) => {
      const next = {
        name: ci.name ?? prev.name,
        city: ci.city ?? prev.city,
        country: ci.country ?? prev.country,
        contactEmail: ci.contactEmail ?? prev.contactEmail,
        contactPhone: ci.contactPhone ?? prev.contactPhone,
      }
      if (
        next.name === prev.name &&
        next.city === prev.city &&
        next.country === prev.country &&
        next.contactEmail === prev.contactEmail &&
        next.contactPhone === prev.contactPhone
      ) {
        return prev
      }
      return next
    })
    const ld = jsonField<Partial<Leadership>>(setupConfig.leadership, {})
    setLeadership((prev) => {
      const next = {
        pastorName: ld.pastorName ?? prev.pastorName,
        adminEmail: ld.adminEmail ?? prev.adminEmail,
        notes: ld.notes ?? prev.notes,
      }
      if (
        next.pastorName === prev.pastorName &&
        next.adminEmail === prev.adminEmail &&
        next.notes === prev.notes
      ) {
        return prev
      }
      return next
    })
    const pc = jsonField<Partial<ProtocolRules>>(setupConfig.protocolConfig, {})
    setProtocol((prev) => {
      const next = {
        maxPerService: String(pc.maxPerService ?? prev.maxPerService),
        monthlyQuota: String(pc.monthlyQuota ?? prev.monthlyQuota),
      }
      if (
        next.maxPerService === prev.maxPerService &&
        next.monthlyQuota === prev.monthlyQuota
      ) {
        return prev
      }
      return next
    })
    const sc = jsonField<Partial<ServicesConfig>>(setupConfig.servicesConfig, {})
    setServices((prev) => {
      const next = {
        sundayName: sc.sundayName ?? prev.sundayName,
        sundayTime: sc.sundayTime ?? prev.sundayTime,
      }
      if (next.sundayName === prev.sundayName && next.sundayTime === prev.sundayTime) {
        return prev
      }
      return next
    })
    const choirs = jsonField<{ choirs?: Array<{ name?: string }> }>(setupConfig.choirsConfig, {})
    const choirName = choirs.choirs?.[0]?.name
    if (choirName) setMainChoirName((prev) => (prev === choirName ? prev : choirName))
  }, [setupConfigKey])

  useEffect(() => {
    if (!ministries?.length) return
    setMinistryActive((prev) => {
      let changed = false
      const next = { ...prev }
      for (const m of ministries) {
        if (m.code && next[m.code] === undefined) {
          next[m.code] = m.isActive !== false
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [ministries])

  useEffect(() => {
    const savedStep = Number(status?.setupStep ?? 0)
    if (savedStep > 0 && savedStep < WIZARD_STEPS.length) {
      setStep(Math.min(savedStep - 1, WIZARD_STEPS.length - 1))
    }
  }, [status?.setupStep])

  const saveStep = useMutation({
    mutationFn: (payload: { step: number; data: Record<string, unknown> }) =>
      setupApi.saveStep({ step: payload.step, data: payload.data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setup'] })
      qc.invalidateQueries({ queryKey: ['setup-status'] })
      qc.invalidateQueries({ queryKey: ['setup-readiness'] })
    },
    onError: () => toast.error('Could not save step', 'Check your permissions and try again.'),
  })

  const ministryPayload = useMemo(() => {
    const enabled: string[] = []
    const disabled: string[] = []
    for (const [code, active] of Object.entries(ministryActive)) {
      if (active) enabled.push(code)
      else disabled.push(code)
    }
    return { enabled, disabled }
  }, [ministryActive])

  async function handleNext() {
    const stepNum = step + 1
    let data: Record<string, unknown> = {}

    switch (step) {
      case 0:
        if (!churchInfo.name.trim()) {
          toast.error('Church name required')
          return
        }
        data = churchInfo
        break
      case 1:
        data = leadership
        break
      case 2:
        data = ministryPayload
        break
      case 3:
        data = {
          choirs: [{ code: 'main', name: mainChoirName.trim() || 'Main Choir' }],
        }
        break
      case 4:
        data = {
          maxPerService: Number(protocol.maxPerService) || 12,
          monthlyQuota: Number(protocol.monthlyQuota) || 3,
          rules: {
            maxPerService: Number(protocol.maxPerService) || 12,
            monthlyQuota: Number(protocol.monthlyQuota) || 3,
          },
        }
        break
      case 5:
        data = {
          sundayName: services.sundayName,
          sundayTime: services.sundayTime,
          services: [
            {
              code: 'SUNDAY_WORSHIP',
              name: services.sundayName,
              dayOfWeek: 0,
            },
          ],
          serviceTimes: { sunday: services.sundayTime },
        }
        break
      case 6:
        data = { confirmed: true }
        break
      default:
        break
    }

    await saveStep.mutateAsync({ step: stepNum, data })
    if (step < WIZARD_STEPS.length - 1) {
      setStep(step + 1)
      if (stepNum === 7) toast.success('Church setup complete!')
    } else {
      toast.success('Setup marked complete')
    }
  }

  const setupComplete = Boolean(status?.setupCompleted)

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle>Church setup wizard</CardTitle>
        <CardDescription>
          {setupComplete
            ? 'Setup is complete — you can revisit any step to update configuration.'
            : 'Guide your church through initial deployment in seven steps.'}
        </CardDescription>
      </CardHeader>

      <FormWizard steps={WIZARD_STEPS} currentStep={step} onStepChange={setStep}>
        {step === 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Church name" required className="sm:col-span-2">
              <Input
                value={churchInfo.name}
                onChange={(e) => setChurchInfo((s) => ({ ...s, name: e.target.value }))}
              />
            </FormField>
            <FormField label="City">
              <Input
                value={churchInfo.city}
                onChange={(e) => setChurchInfo((s) => ({ ...s, city: e.target.value }))}
              />
            </FormField>
            <FormField label="Country">
              <Input
                value={churchInfo.country}
                onChange={(e) => setChurchInfo((s) => ({ ...s, country: e.target.value }))}
              />
            </FormField>
            <FormField label="Contact email">
              <Input
                type="email"
                value={churchInfo.contactEmail}
                onChange={(e) => setChurchInfo((s) => ({ ...s, contactEmail: e.target.value }))}
              />
            </FormField>
            <FormField label="Contact phone">
              <Input
                value={churchInfo.contactPhone}
                onChange={(e) => setChurchInfo((s) => ({ ...s, contactPhone: e.target.value }))}
              />
            </FormField>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <FormField label="Lead pastor / bishop">
              <Input
                value={leadership.pastorName}
                onChange={(e) => setLeadership((s) => ({ ...s, pastorName: e.target.value }))}
              />
            </FormField>
            <FormField label="Church admin email">
              <Input
                type="email"
                value={leadership.adminEmail}
                onChange={(e) => setLeadership((s) => ({ ...s, adminEmail: e.target.value }))}
              />
            </FormField>
            <FormField label="Notes">
              <Textarea
                rows={3}
                value={leadership.notes}
                onChange={(e) => setLeadership((s) => ({ ...s, notes: e.target.value }))}
              />
            </FormField>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <p className="text-sm text-text-secondary mb-3">
              Enable ministries that are active in your church.
            </p>
            {(ministries ?? []).map((m) => (
              <label
                key={m.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-surface-raised cursor-pointer"
              >
                <span className="text-sm font-medium">{m.name}</span>
                <input
                  type="checkbox"
                  checked={m.code ? ministryActive[m.code] !== false : true}
                  disabled={!m.code}
                  onChange={(e) => {
                    if (!m.code) return
                    setMinistryActive((s) => ({ ...s, [m.code!]: e.target.checked }))
                  }}
                  className="h-4 w-4 rounded border-border"
                />
              </label>
            ))}
          </div>
        )}

        {step === 3 && (
          <FormField label="Main choir name" hint="Creates or updates the primary choir.">
            <Input value={mainChoirName} onChange={(e) => setMainChoirName(e.target.value)} />
          </FormField>
        )}

        {step === 4 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Max protocol members per service">
              <Input
                type="number"
                min="1"
                value={protocol.maxPerService}
                onChange={(e) => setProtocol((s) => ({ ...s, maxPerService: e.target.value }))}
              />
            </FormField>
            <FormField label="Monthly service quota per member">
              <Input
                type="number"
                min="1"
                value={protocol.monthlyQuota}
                onChange={(e) => setProtocol((s) => ({ ...s, monthlyQuota: e.target.value }))}
              />
            </FormField>
          </div>
        )}

        {step === 5 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Primary service name">
              <Input
                value={services.sundayName}
                onChange={(e) => setServices((s) => ({ ...s, sundayName: e.target.value }))}
              />
            </FormField>
            <FormField label="Start time">
              <Input
                type="time"
                value={services.sundayTime}
                onChange={(e) => setServices((s) => ({ ...s, sundayTime: e.target.value }))}
              />
            </FormField>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 size={18} />
              <span className="font-semibold">Ready to finalize</span>
            </div>
            <ul className="space-y-1 text-text-secondary">
              <li><strong>Church:</strong> {churchInfo.name || '—'}</li>
              <li><strong>Leadership:</strong> {leadership.pastorName || '—'}</li>
              <li><strong>Active ministries:</strong> {ministryPayload.enabled.length}</li>
              <li><strong>Main choir:</strong> {mainChoirName}</li>
              <li><strong>Protocol cap:</strong> {protocol.maxPerService} per service</li>
              <li><strong>Primary service:</strong> {services.sundayName} at {services.sundayTime}</li>
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-surface-raised"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={saveStep.isPending}
            className="px-5 py-2 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-60"
          >
            {saveStep.isPending
              ? 'Saving…'
              : step === WIZARD_STEPS.length - 1
                ? 'Complete setup'
                : 'Save & continue'}
          </button>
        </div>
      </FormWizard>
    </Card>
  )
}
