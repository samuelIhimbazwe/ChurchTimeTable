'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}

/* Deterministic gradient from name */
const GRADIENTS = [
  'from-primary-700 to-primary-500',
  'from-gold-700 to-gold-500',
  'from-primary-800 to-primary-600',
  'from-success to-primary-500',
  'from-info to-primary-600',
]
function gradientFor(name: string) {
  const idx = name.charCodeAt(0) % GRADIENTS.length
  return GRADIENTS[idx]
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface AvatarProps {
  name: string
  src?: string | null
  size?: AvatarSize
  className?: string
  active?: boolean   /* gold presence ring */
}

export default function Avatar({
  name,
  src,
  size = 'md',
  className,
  active,
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative inline-flex shrink-0',
        active && 'ring-2 ring-gold-500 ring-offset-2 ring-offset-surface',
        SIZE_CLASSES[size],
        'rounded-full',
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="rounded-full object-cover"
          sizes="80px"
        />
      ) : (
        <div
          className={cn(
            'w-full h-full rounded-full flex items-center justify-center',
            'bg-gradient-to-br text-white font-semibold',
            gradientFor(name),
          )}
        >
          {initials(name)}
        </div>
      )}
    </div>
  )
}

/* Stacked group of avatars */
export function AvatarStack({
  names,
  max = 4,
  size = 'sm',
}: {
  names: string[]
  max?: number
  size?: AvatarSize
}) {
  const visible  = names.slice(0, max)
  const overflow = names.length - max

  return (
    <div className="flex items-center">
      {visible.map((name) => (
        <div key={name} className={cn('-ml-2 first:ml-0', 'ring-2 ring-surface rounded-full')}>
          <Avatar name={name} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            '-ml-2 ring-2 ring-surface rounded-full',
            'flex items-center justify-center',
            'bg-surface-overlay text-text-secondary font-semibold',
            SIZE_CLASSES[size],
          )}
        >
          <span className="text-[10px]">+{overflow}</span>
        </div>
      )}
    </div>
  )
}
