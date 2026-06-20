'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { fieldClassName, fieldErrorClassName } from './field-styles'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(fieldClassName, 'resize-none min-h-[88px]', error && fieldErrorClassName, className)}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
