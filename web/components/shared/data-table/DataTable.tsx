'use client'

import { useMemo, useState, useRef, useEffect, useCallback, Fragment } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react'
import Card from '@/components/shared/Card'
import { TableScroll, ResponsiveDataView } from '@/components/shared/TableScroll'
import { cn } from '@/lib/utils'
import { isNestedInteractiveClick } from '@/lib/clickability'
import { DataTablePagination } from './DataTablePagination'
import { DataTableBulkBar } from './DataTableBulkBar'
import type {
  DataTableColumn,
  DataTableDensity,
  DataTablePaginationOptions,
  DataTableProps,
} from './types'
const DEFAULT_PAGE_SIZE = 25
const DEFAULT_PAGE_SIZES = [10, 25, 50, 100]

function resolvePaginationOptions(
  pagination?: boolean | DataTablePaginationOptions,
): DataTablePaginationOptions | null {
  if (!pagination) return null
  if (pagination === true) return { pageSize: DEFAULT_PAGE_SIZE, pageSizes: DEFAULT_PAGE_SIZES }
  return {
    pageSize: pagination.pageSize ?? DEFAULT_PAGE_SIZE,
    pageSizes: pagination.pageSizes ?? DEFAULT_PAGE_SIZES,
    manual: pagination.manual,
    pageCount: pagination.pageCount,
    totalCount: pagination.totalCount,
  }
}

const DENSITY_CELL: Record<DataTableDensity, string> = {
  comfortable: 'px-4 py-3',
  dense: 'px-3 py-2',
}

const DENSITY_HEAD: Record<DataTableDensity, string> = {
  comfortable: 'px-4 py-3',
  dense: 'px-3 py-2',
}

function alignClass(align?: 'left' | 'right' | 'center') {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

function defaultSortValue(value: unknown): string | number {
  if (value == null) return ''
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  return String(value).toLowerCase()
}

function buildColumnDef<T>(col: DataTableColumn<T>): ColumnDef<T, unknown> {
  return {
    id: col.id,
    accessorFn: col.accessorFn,
    header: col.header,
    enableSorting: col.sortable ?? false,
    sortingFn: col.sortFn
      ? (rowA, rowB) => col.sortFn!(rowA.original, rowB.original)
      : (rowA, rowB) => {
          const a = defaultSortValue(col.accessorFn?.(rowA.original))
          const b = defaultSortValue(col.accessorFn?.(rowB.original))
          if (a < b) return -1
          if (a > b) return 1
          return 0
        },
    cell: ({ row }) => {
      const value = col.accessorFn?.(row.original)
      if (col.cell) return col.cell({ row: row.original, value })
      if (value == null || value === '') return <span className="text-text-muted">—</span>
      return String(value)
    },
    meta: {
      align: col.align,
      sticky: col.sticky,
      headerClassName: col.headerClassName,
      cellClassName: col.cellClassName,
    },
  }
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp size={12} className="text-primary-600" aria-hidden />
  if (sorted === 'desc') return <ArrowDown size={12} className="text-primary-600" aria-hidden />
  return <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-40" aria-hidden />
}

function DataTableSkeleton({
  columns,
  rows,
  density,
}: {
  columns: number
  rows: number
  density: DataTableDensity
}) {
  const cellPad = DENSITY_CELL[density]
  return (
    <div className="animate-pulse">
      <div className="border-b border-border bg-surface-raised flex">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={cn(cellPad, 'flex-1 min-w-[80px]')}>
            <div className="h-3 bg-surface-overlay rounded w-2/3" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="border-b border-border flex">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div key={colIdx} className={cn(cellPad, 'flex-1 min-w-[80px]')}>
              <div className="h-3.5 bg-surface-overlay rounded w-full max-w-[140px]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  rowClassName,
  stickyHeader = true,
  stickyFirstColumn = true,
  density = 'comfortable',
  zebra = true,
  minWidth = 640,
  emptyState,
  isLoading = false,
  loadingRows = 6,
  manualSorting = false,
  sorting: controlledSorting,
  onSortingChange,
  pagination: paginationProp,
  paginationState: controlledPagination,
  onPaginationChange,
  mobileRow,
  toolbar,
  footer,
  resultCount,
  resultLabel,
  className,
  'aria-label': ariaLabel,
  enableRowSelection = false,
  bulkActions,
  summaryRow,
  visibleColumnIds: controlledVisibleIds,
  onVisibleColumnIdsChange: _onVisibleColumnIdsChange,
  renderExpandedRow,
  expandedRowIds: controlledExpandedIds,
  onExpandedRowIdsChange,
}: DataTableProps<T>) {
  const tableRef = useRef<HTMLTableElement>(null)
  const [focusedRowIndex, setFocusedRowIndex] = useState(0)
  const [internalVisibleIds] = useState<string[]>(() =>
    columns.map((c) => c.id),
  )
  const visibleColumnIds = controlledVisibleIds ?? internalVisibleIds
  void _onVisibleColumnIdsChange

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [internalExpandedIds, setInternalExpandedIds] = useState<string[]>([])
  const expandedRowIds = controlledExpandedIds ?? internalExpandedIds
  const setExpandedRowIds = onExpandedRowIdsChange ?? setInternalExpandedIds

  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleColumnIds.includes(c.id)),
    [columns, visibleColumnIds],
  )
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const sorting = controlledSorting ?? internalSorting
  const setSorting = onSortingChange ?? setInternalSorting

  const paginationOptions = resolvePaginationOptions(paginationProp)
  const paginateEnabled = paginationOptions != null

  const [internalPagination, setInternalPagination] = useState<PaginationState>(() => ({
    pageIndex: 0,
    pageSize: paginationOptions?.pageSize ?? DEFAULT_PAGE_SIZE,
  }))
  const pagination = controlledPagination ?? internalPagination
  const setPagination = onPaginationChange ?? setInternalPagination

  const columnDefs = useMemo(() => {
    const defs = visibleColumns.map(buildColumnDef)
    if (enableRowSelection) {
      const selectCol: ColumnDef<T, unknown> = {
        id: '__select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            ref={(el) => {
              if (el) el.indeterminate = table.getIsSomePageRowsSelected()
            }}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select all rows"
            className="rounded border-border"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select row"
            className="rounded border-border"
          />
        ),
        enableSorting: false,
        meta: { align: 'center' as const },
      }
      return [selectCol, ...defs]
    }
    if (renderExpandedRow) {
      const expandCol: ColumnDef<T, unknown> = {
        id: '__expand',
        header: '',
        cell: ({ row }) => {
          const id = getRowId(row.original)
          const open = expandedRowIds.includes(id)
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setExpandedRowIds(
                  open
                    ? expandedRowIds.filter((x) => x !== id)
                    : [...expandedRowIds, id],
                )
              }}
              className="p-1 rounded text-text-muted hover:text-text-primary"
              aria-label={open ? 'Collapse row' : 'Expand row'}
            >
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )
        },
        enableSorting: false,
      }
      return [expandCol, ...defs]
    }
    return defs
  }, [
    visibleColumns,
    enableRowSelection,
    renderExpandedRow,
    expandedRowIds,
    setExpandedRowIds,
    getRowId,
  ])

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: {
      sorting,
      ...(paginateEnabled ? { pagination } : {}),
      ...(enableRowSelection ? { rowSelection } : {}),
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(next)
    },
    onPaginationChange: paginateEnabled
      ? (updater) => {
          const next = typeof updater === 'function' ? updater(pagination) : updater
          setPagination(next)
        }
      : undefined,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: paginateEnabled ? getPaginationRowModel() : undefined,
    manualSorting,
    manualPagination: paginateEnabled && (paginationOptions?.manual ?? false),
    pageCount: paginationOptions?.manual ? paginationOptions.pageCount : undefined,
    autoResetPageIndex: true,
    getRowId: (row) => getRowId(row),
  })

  const stickyColId = useMemo(() => {
    const explicit = visibleColumns.find((c) => c.sticky)?.id
    if (explicit) return explicit
    if (stickyFirstColumn && visibleColumns[0]) return visibleColumns[0].id
    return null
  }, [visibleColumns, stickyFirstColumn])

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)
  const selectedIds = Object.keys(rowSelection)

  const clearSelection = useCallback(() => setRowSelection({}), [])

  useEffect(() => {
    if (!onRowClick && !enableRowSelection) return
    function onKey(e: KeyboardEvent) {
      const rows = table.getRowModel().rows
      if (rows.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedRowIndex((i) => Math.min(i + 1, rows.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedRowIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && rows[focusedRowIndex]) {
        e.preventDefault()
        onRowClick?.(rows[focusedRowIndex].original)
      }
    }
    const el = tableRef.current
    el?.addEventListener('keydown', onKey)
    return () => el?.removeEventListener('keydown', onKey)
  }, [table, focusedRowIndex, onRowClick, enableRowSelection])

  const headPad = DENSITY_HEAD[density]
  const cellPad = DENSITY_CELL[density]
  const pageRows = table.getRowModel().rows.map((r) => r.original)
  const displayCount = resultCount ?? (paginateEnabled ? table.getFilteredRowModel().rows.length : data.length)

  const tableBody = (
    <TableScroll minWidth={minWidth}>
      <table
        ref={tableRef}
        tabIndex={0}
        className={cn('data-table w-full text-sm outline-none', zebra && 'data-table-zebra')}
        aria-label={ariaLabel}
      >
        <thead className={cn(stickyHeader && 'data-table-sticky-head')}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-border bg-surface-raised text-left text-xs uppercase tracking-wide text-text-muted"
            >
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as {
                  align?: 'left' | 'right' | 'center'
                  sticky?: boolean
                  headerClassName?: string
                } | undefined
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                const isSticky = stickyColId != null && header.column.id === stickyColId

                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={cn(
                      headPad,
                      'font-semibold whitespace-nowrap',
                      alignClass(meta?.align),
                      isSticky && 'data-table-sticky-col data-table-sticky-col-head',
                      meta?.headerClassName,
                    )}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          'group inline-flex items-center gap-1 hover:text-text-primary transition-colors',
                          alignClass(meta?.align),
                          meta?.align === 'right' && 'ml-auto',
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon sorted={sorted} />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, rowIndex) => {
            const original = row.original
            const clickable = !!onRowClick
            const rowId = getRowId(original)
            const isExpanded = expandedRowIds.includes(rowId)
            return (
              <Fragment key={row.id}>
              <tr
                onClick={
                  clickable
                    ? (e) => {
                        if (isNestedInteractiveClick(e.target)) return
                        onRowClick(original)
                      }
                    : undefined
                }
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(original)
                        }
                      }
                    : undefined
                }
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  clickable && 'interactive-row cursor-pointer hover:bg-primary-50/50',
                  rowIndex === focusedRowIndex && clickable && 'bg-primary-50/40',
                  rowClassName?.(original),
                  row.getIsSelected() && 'bg-primary-50/60',
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as {
                    align?: 'left' | 'right' | 'center'
                    sticky?: boolean
                    cellClassName?: string
                  } | undefined
                  const isSticky = stickyColId != null && cell.column.id === stickyColId

                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        cellPad,
                        alignClass(meta?.align),
                        isSticky && 'data-table-sticky-col',
                        meta?.align === 'right' && 'tabular-nums',
                        meta?.cellClassName,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
              </tr>
              {isExpanded && renderExpandedRow && (
                <tr key={`${row.id}-expanded`} className="bg-surface-raised/50">
                  <td colSpan={row.getVisibleCells().length} className="px-4 py-3">
                    {renderExpandedRow(original)}
                  </td>
                </tr>
              )}
              </Fragment>
            )
          })}
        </tbody>
        {summaryRow && data.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-border bg-surface-raised font-semibold text-sm">
              {table.getHeaderGroups()[0]?.headers.map((header, i) => {
                const colId = header.column.id
                const cell = summaryRow.cells[colId]
                return (
                  <td key={header.id} className={cn(cellPad, i === 0 && !cell && summaryRow.label ? 'text-text-primary' : 'text-text-secondary')}>
                    {i === 0 && !cell && summaryRow.label ? summaryRow.label : cell ?? ''}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </TableScroll>
  )

  const content = isLoading ? (
    <DataTableSkeleton columns={visibleColumns.length + (enableRowSelection || renderExpandedRow ? 1 : 0)} rows={loadingRows} density={density} />
  ) : data.length === 0 && emptyState ? (
    emptyState
  ) : mobileRow ? (
    <ResponsiveDataView
      items={pageRows}
      keyFn={getRowId}
      mobileRow={mobileRow}
      table={tableBody}
      empty={emptyState}
    />
  ) : (
    tableBody
  )

  const paginationFooter =
    paginateEnabled && !isLoading && data.length > 0 ? (
      <DataTablePagination
        table={table}
        config={paginationOptions ?? undefined}
        resultLabel={resultLabel}
      />
    ) : null

  return (
    <div className={cn('space-y-3 min-w-0', className)}>
      {enableRowSelection && bulkActions && (
        <DataTableBulkBar selectedCount={selectedIds.length} onClear={clearSelection}>
          {bulkActions({ selectedRows, selectedIds, clearSelection })}
        </DataTableBulkBar>
      )}
      {toolbar}
      <Card padding="none" className="overflow-hidden">
        {content}
        {paginationFooter}
        {!isLoading && data.length > 0 && footer && (
          <div className="border-t border-border px-4 py-3 bg-surface-raised/50 text-xs text-text-muted">
            {footer}
          </div>
        )}
      </Card>
      {!toolbar && displayCount > 0 && !isLoading && !paginateEnabled && (
        <p className="text-xs text-text-muted tabular-nums px-1">
          {displayCount.toLocaleString()} {resultLabel ?? 'rows'}
        </p>
      )}
    </div>
  )
}

export type {
  DataTableColumn,
  DataTablePaginationOptions,
  DataTableProps,
  PaginationState,
  SortingState,
}
