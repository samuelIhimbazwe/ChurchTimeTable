import { z } from 'zod'

export const activityFormSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters'),
    activityType: z.enum([
      'SERVICE',
      'REHEARSAL',
      'PRAYER',
      'MEETING',
      'CONCERT',
      'SPECIAL_REHEARSAL',
    ]),
    startAt: z.string().min(1, 'Start time is required'),
    endAt: z.string().min(1, 'End time is required'),
    location: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => !data.startAt || !data.endAt || new Date(data.endAt) > new Date(data.startAt),
    { message: 'End must be after start', path: ['endAt'] },
  )

export type ActivityFormValues = z.infer<typeof activityFormSchema>

export const welfareCaseFormSchema = z.object({
  memberId: z.string().min(1, 'Select a member'),
  type: z.string().trim().min(2, 'Case type is required'),
  description: z.string().trim().min(10, 'Please describe the situation (min 10 characters)'),
})

export type WelfareCaseFormValues = z.infer<typeof welfareCaseFormSchema>

export const profileFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().optional(),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>

export const joinRequestFormSchema = z.object({
  requestType: z.string().min(1, 'Select how you are joining'),
  message: z.string().max(500, 'Message is too long').optional(),
})

export type JoinRequestFormValues = z.infer<typeof joinRequestFormSchema>

export const songFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  composer: z.string().optional(),
  language: z.string().optional(),
  lyrics: z.string().optional(),
})

export type SongFormValues = z.infer<typeof songFormSchema>

export const contributeClaimFormSchema = z.object({
  typeId: z.string().min(1, 'Select a contribution type'),
  customType: z.string().optional(),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => {
      const n = parseFloat(v)
      return Number.isFinite(n) && n > 0
    }, 'Amount must be greater than zero'),
  paymentAt: z.string().min(1, 'Payment date is required'),
  channel: z.enum(['MOMO', 'BANK', 'OTHER']),
  notes: z.string().optional(),
})

export type ContributeClaimFormValues = z.infer<typeof contributeClaimFormSchema>

export const announcementFormSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters'),
    body: z.string().trim().min(5, 'Message must be at least 5 characters'),
    audience: z.enum([
      'ENTIRE_CHOIR',
      'LEADERSHIP',
      'FAMILIES',
      'VOICE_SECTION',
      'CUSTOM_GROUP',
    ]),
    audienceRef: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const needsRef =
      data.audience === 'FAMILIES' ||
      data.audience === 'VOICE_SECTION' ||
      data.audience === 'CUSTOM_GROUP'
    if (needsRef && !data.audienceRef?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select or enter the audience target',
        path: ['audienceRef'],
      })
    }
  })

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>

export const meetingFormSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters'),
  scheduledAt: z.string().min(1, 'Date and time is required'),
  location: z.string().optional(),
  agenda: z.string().optional(),
})

export type MeetingFormValues = z.infer<typeof meetingFormSchema>

export const disciplineCaseFormSchema = z.object({
  memberId: z.string().min(1, 'Select a member'),
  description: z.string().trim().min(10, 'Please describe the situation (min 10 characters)'),
})

export type DisciplineCaseFormValues = z.infer<typeof disciplineCaseFormSchema>

export const maintenanceLogFormSchema = z.object({
  assetId: z.string().min(1, 'Select an asset'),
  type: z.enum(['SERVICE', 'REPAIR', 'INSPECTION', 'UPGRADE']),
  description: z.string().trim().min(3, 'Describe what was done'),
  nextMaintenanceDate: z.string().optional(),
})

export type MaintenanceLogFormValues = z.infer<typeof maintenanceLogFormSchema>

export const uniformTypeFormSchema = z.object({
  typeCode: z.string().trim().min(2, 'Type code is required'),
  typeName: z.string().trim().min(2, 'Type name is required'),
})

export const uniformItemFormSchema = z.object({
  uniformTypeId: z.string().min(1, 'Select a uniform type'),
  label: z.string().trim().min(1, 'Item label is required'),
  size: z.string().optional(),
})

export const uniformIssueFormSchema = z.object({
  issueItemId: z.string().min(1, 'Uniform item ID is required'),
  issueMemberId: z.string().min(1, 'Select a member'),
})

export const equipmentFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  category: z.string().optional(),
})

export const equipmentAssignFormSchema = z.object({
  assignEquipmentId: z.string().min(1, 'Equipment ID is required'),
  assignMemberId: z.string().min(1, 'Select a member'),
})

export const assetRegistryFormSchema = z.object({
  code: z.string().trim().min(1, 'Asset code is required'),
  name: z.string().trim().min(2, 'Asset name is required'),
  categoryId: z.string().min(1, 'Select a category'),
})

export type AssetRegistryFormValues = z.infer<typeof assetRegistryFormSchema>
