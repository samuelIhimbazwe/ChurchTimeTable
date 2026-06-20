import type { PaginationState, SortingState } from '@tanstack/react-table'

export type DataTableAlign = 'left' | 'right' | 'center'

export type DataTableDensity = 'comfortable' | 'dense'

export type DataTableColumn<T> = {
  id: string
  header: string
  /** Used for default cell rendering and client-side sort when no custom sortFn */
  accessorFn?: (row: T) => unknown
  cell?: (ctx: { row: T; value: unknown }) => React.ReactNode
  sortable?: boolean
  sortFn?: (a: T, b: T) => number
  align?: DataTableAlign
  /** Pin column on horizontal scroll (typically the identifier column) */
  sticky?: boolean
  headerClassName?: string
  cellClassName?: string
}

export type DataTablePaginationOptions = {
  /** Initial rows per page (default 25) */
  pageSize?: number
  /** Page size selector options (default [10, 25, 50, 100]) */
  pageSizes?: number[]
  /** Server-side mode — supply pageCount / totalCount from API */
  manual?: boolean
  pageCount?: number
  totalCount?: number
}

export type DataTableSummaryRow<T> = {
  label?: string
  cells: Record<string, React.ReactNode>
}

export type DataTableBulkContext<T> = {
  selectedRows: T[]
  selectedIds: string[]
  clearSelection: () => void
}

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string | undefined
  stickyHeader?: boolean
  stickyFirstColumn?: boolean
  density?: DataTableDensity
  zebra?: boolean
  minWidth?: number
  emptyState?: React.ReactNode
  isLoading?: boolean
  loadingRows?: number
  manualSorting?: boolean
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  /** Enable client- or server-side pagination */
  pagination?: boolean | DataTablePaginationOptions
  paginationState?: PaginationState
  onPaginationChange?: (state: PaginationState) => void
  /** Card list on phones; table from md up */
  mobileRow?: (row: T) => React.ReactNode
  toolbar?: React.ReactNode
  footer?: React.ReactNode
  resultCount?: number
  resultLabel?: string
  className?: string
  'aria-label'?: string
  /** Stable id for saved column views */
  tableId?: string
  /** Enable row checkboxes + bulk bar */
  enableRowSelection?: boolean
  bulkActions?: (ctx: DataTableBulkContext<T>) => React.ReactNode
  /** Footer summary cells keyed by column id */
  summaryRow?: DataTableSummaryRow<T>
  /** Controlled visible column ids */
  visibleColumnIds?: string[]
  onVisibleColumnIdsChange?: (ids: string[]) => void
  /** Expandable row detail */
  renderExpandedRow?: (row: T) => React.ReactNode
  expandedRowIds?: string[]
  onExpandedRowIdsChange?: (ids: string[]) => void
}

export type DataTableFilterChipProps = {
  label: string
  active?: boolean
  count?: number
  onClick?: () => void
  onClear?: () => void
}
