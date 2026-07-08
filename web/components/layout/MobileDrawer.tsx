'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import Sidebar from './Sidebar'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

interface MobileDrawerProps {
  open:    boolean
  onClose: () => void
  role?:   string
}

export default function MobileDrawer({ open, onClose, role }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(drawerRef, open)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden',
          'transition-opacity duration-normal',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <div
        ref={drawerRef}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(280px,88vw)] lg:hidden safe-top safe-bottom',
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
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-md bg-surface border border-border text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </>
  )
}
