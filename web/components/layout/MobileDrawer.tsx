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
        aria-hidden={!open}
      />

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] lg:hidden',
          'transition-transform duration-normal ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="relative h-full overflow-hidden">
          <Sidebar role={role} variant="mobile" onNavigate={onClose} />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="absolute top-3.5 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-md bg-primary-800 text-text-inverse hover:bg-primary-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </>
  )
}
