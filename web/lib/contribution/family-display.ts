type BadgeVariant =
  | 'status-present'
  | 'status-excused'
  | 'status-pending'
  | 'status-absent'

export function ledgerStatusLabel(displayStatus: string): string {
  switch (displayStatus) {
    case 'APPROVED':
      return 'Approved'
    case 'PARTIAL':
      return 'Partially approved'
    case 'REJECTED':
      return 'Rejected'
    case 'WAITING':
      return 'Waiting'
    default:
      return displayStatus
  }
}

export function ledgerStatusVariant(displayStatus: string): BadgeVariant {
  switch (displayStatus) {
    case 'APPROVED':
      return 'status-present'
    case 'PARTIAL':
      return 'status-excused'
    case 'REJECTED':
      return 'status-absent'
    case 'WAITING':
    default:
      return 'status-pending'
  }
}

export function thankYouLabel(status: string): string {
  switch (status) {
    case 'SENT':
      return 'Thank-you sent'
    case 'FAILED':
      return 'Thank-you failed'
    case 'PENDING':
    default:
      return 'Thank-you pending'
  }
}

export function thankYouVariant(status: string): BadgeVariant {
  switch (status) {
    case 'SENT':
      return 'status-present'
    case 'FAILED':
      return 'status-absent'
    default:
      return 'status-pending'
  }
}
