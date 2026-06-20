'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { fieldClassName, fieldErrorClassName } from './field-styles'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(fieldClassName, error && fieldErrorClassName, className)}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
