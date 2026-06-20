'use client'

import { cn } from '@/lib/utils'

type Props = {
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
}

export function QuickActionFab({
  label,
  onClick,
  disabled,
  className,
  icon,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'lg:hidden fixed z-30 right-4 bottom-[calc(7.25rem+env(safe-area-inset-bottom,0px))]',
        'flex items-center gap-2 px-4 py-3 rounded-full shadow-overlay',
        'bg-success text-white font-semibold text-sm',
        'hover:bg-success/90 active:scale-95 transition-all disabled:opacity-50',
        className,
      )}
    >
      {icon}
      <span className="max-w-[10rem] truncate">{label}</span>
    </button>
  )
}
