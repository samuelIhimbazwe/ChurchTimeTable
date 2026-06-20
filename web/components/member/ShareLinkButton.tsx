'use client'

import { Share2 } from 'lucide-react'
import { toast } from '@/components/shared/Toast'

type Props = {
  title: string
  url: string
  text?: string
  className?: string
}

export function ShareLinkButton({ title, url, text, className }: Props) {
  async function handleShare() {
    const shareText = text ?? title
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url })
        return
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Could not share link')
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className={className ?? 'inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800'}
    >
      <Share2 size={14} />
      Share
    </button>
  )
}
