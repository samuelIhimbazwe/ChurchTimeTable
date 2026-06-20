'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { fieldClassName, fieldErrorClassName } from './field-styles'

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(fieldClassName, error && fieldErrorClassName, className)}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'
