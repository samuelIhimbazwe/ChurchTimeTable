'use client'



import { LeadershipAttentionPanel } from '@/components/shared/office/LeadershipAttentionPanel'

import { useAttentionItems } from '@/lib/dashboard/useAttentionItems'



type Props = {

  title?: string

  className?: string

}



export function UnifiedAttentionInbox({ title = 'Needs your attention', className }: Props) {

  const { items } = useAttentionItems()



  if (items.length === 0) return null



  return (

    <LeadershipAttentionPanel title={title} items={items} className={className} />

  )

}

