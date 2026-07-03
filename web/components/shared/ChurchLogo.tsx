import { CHURCH_LOGO_ALT, CHURCH_LOGO_SRC } from '@/lib/constants/church-branding'
import { cn } from '@/lib/utils'

const SIZE_CLASS = {
  sm: 'h-10',
  md: 'h-16',
  lg: 'h-24',
} as const

type Props = {
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export function ChurchLogo({ size = 'md', className }: Props) {
  return (
    <img
      src={CHURCH_LOGO_SRC}
      alt={CHURCH_LOGO_ALT}
      className={cn('w-auto object-contain', SIZE_CLASS[size], className)}
    />
  )
}
