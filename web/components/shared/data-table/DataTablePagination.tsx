'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

export type DataTablePaginationConfig = {
  /** Initial / default rows per page (default 25) */
  pageSize?: number
  /** Page size options in the footer selector (default [10, 25, 50, 100]) */
  pageSizes?: number[]
  /** Server-side pagination — pass total pages from API */
  manual?: boolean
  pageCount?: number
  /** Total rows across all pages (server-side); defaults to client data length */
  totalCount?: number
}

type Props<T> = {
  table: Table<T>
  config?: DataTablePaginationConfig
  resultLabel?: string
  className?: string
}

export function DataTablePagination<T>({
  table,
  config,
  resultLabel = 'rows',
  className,
}: Props<T>) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const pageSizes = config?.pageSizes ?? [10, 25, 50, 100]
  const totalRows = config?.manual
    ? (config.totalCount ?? 0)
    : table.getFilteredRowModel().rows.length
  const pageCount = config?.manual
    ? (config.pageCount ?? table.getPageCount())
    : table.getPageCount()

  if (totalRows === 0) return null

  const start = pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, totalRows)
  const canPrev = pageIndex > 0
  const canNext = pageIndex < pageCount - 1

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        'border-t border-border px-3 py-3 sm:px-4 bg-surface-raised/50',
        className,
      )}
    >
      <p className="text-xs text-text-muted tabular-nums order-2 sm:order-1">
        Showing{' '}
        <span className="font-semibold text-text-secondary">
          {start.toLocaleString()}–{end.toLocaleString()}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-text-secondary">{totalRows.toLocaleString()}</span>{' '}
        {resultLabel}
      </p>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 order-1 sm:order-2">
        <label className="inline-flex items-center gap-2 text-xs text-text-muted">
          <span className="whitespace-nowrap">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value))
              table.setPageIndex(0)
            }}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-500"
            aria-label="Rows per page"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <PaginationButton
            onClick={() => table.setPageIndex(0)}
            disabled={!canPrev}
            label="First page"
          >
            <ChevronsLeft size={14} />
          </PaginationButton>
          <PaginationButton
            onClick={() => table.previousPage()}
            disabled={!canPrev}
            label="Previous page"
          >
            <ChevronLeft size={14} />
          </PaginationButton>

          <span className="min-w-[5.5rem] text-center text-xs font-semibold text-text-secondary tabular-nums px-1">
            Page {pageIndex + 1} of {Math.max(pageCount, 1)}
          </span>

          <PaginationButton
            onClick={() => table.nextPage()}
            disabled={!canNext}
            label="Next page"
          >
            <ChevronRight size={14} />
          </PaginationButton>
          <PaginationButton
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!canNext}
            label="Last page"
          >
            <ChevronsRight size={14} />
          </PaginationButton>
        </div>
      </div>
    </div>
  )
}

function PaginationButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border',
        'text-text-secondary hover:bg-surface hover:text-text-primary transition-colors',
        'disabled:opacity-40 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
      )}
    >
      {children}
    </button>
  )
}
