'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { protocolApi } from '@/lib/api'
import { SkeletonCard } from '@/components/shared'
import { ProtocolScheduleOfficialDocument } from '@/components/protocol/scheduling/ProtocolScheduleOfficialDocument'
import { ProtocolScheduleExportMenu } from '@/components/protocol/scheduling/ProtocolScheduleExportMenu'
import { Printer } from 'lucide-react'

export default function ProtocolSchedulePrintPage() {
  const { planId } = useParams<{ planId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['protocol-monthly-schedule-print', planId],
    queryFn: () => protocolApi.getMonthlySchedulePrint(planId),
    enabled: Boolean(planId),
  })

  if (isLoading || !data) {
    return <SkeletonCard />
  }

  return (
    <div className="print-schedule-root">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-schedule-root, .print-schedule-root * { visibility: visible; }
          .print-schedule-root { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        .schedule-doc {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
      `}</style>

      <div className="no-print mb-6 max-w-3xl mx-auto flex flex-wrap gap-3 items-center">
        <Link href={`/protocol/scheduling/${planId}`} className="btn-secondary">
          ← Back to workspace
        </Link>
        <ProtocolScheduleExportMenu data={data} />
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => window.print()}
        >
          <Printer size={16} />
          Print
        </button>
      </div>

      <article className="schedule-doc">
        <ProtocolScheduleOfficialDocument data={data} />
      </article>
    </div>
  )
}
