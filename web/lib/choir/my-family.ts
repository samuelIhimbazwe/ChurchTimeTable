export type ChoirMyFamilyMember = {
  id: string
  name: string
  memberNumber: string | null
  role: string
  isMe: boolean
}

export type ChoirMyFamilyResponse = {
  family: {
    id: string
    code: string
    name: string
    head: { id: string; name: string; memberNumber: string | null } | null
    myRole: string
    payment: {
      momoNumber: string | null
      momoAccountName: string | null
      bankAccount: string | null
      bankName: string | null
      instructions: string | null
    }
    members: ChoirMyFamilyMember[]
  }
}
