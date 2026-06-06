'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import Sidebar from './Sidebar'
import { cn } from '@/lib/utils'

interface MobileDrawerProps {
  open:    boolean
  onClose: () => void
  role?:   string
}

export default function MobileDrawer({ open, onClose, role }: MobileDrawerProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-primary-950/60 backdrop-blur-sm lg:hidden',
          'transition-opacity duration-normal',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:hidden',
          'transition-transform duration-normal ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="relative h-full">
          <Sidebar role={role} />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="absolute top-4 right-[-44px] w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-secondary shadow-md"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </>
  )
}
