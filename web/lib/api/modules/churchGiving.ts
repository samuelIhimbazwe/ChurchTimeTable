import { apiClient } from '../client'

export type ChurchGivingPaymentBox = {
  momoNumber: string | null
  momoAccountName: string | null
  bankAccount: string | null
  bankName: string | null
  instructions: string | null
}

export type ChurchGivingSettings = {
  tithesOfferings: ChurchGivingPaymentBox
  inyubako: ChurchGivingPaymentBox
}

export const churchGivingApi = {
  getPublic: () =>
    apiClient.get<never, ChurchGivingSettings>('/church/public/giving'),

  get: () => apiClient.get<never, ChurchGivingSettings>('/church/giving'),

  update: (payload: Partial<ChurchGivingSettings>) =>
    apiClient.patch<never, ChurchGivingSettings>('/church/giving', payload),
}
