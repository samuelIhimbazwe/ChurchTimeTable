import { cn } from "@/core/utils/cn";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";

export interface CmmsTableColumn<T> {
  key?: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

export function CmmsTable<T>({
  columns,
  rows,
  emptyState,
  className,
  compact = false,
}: Readonly<{
  columns: CmmsTableColumn<T>[];
  rows: T[];
  emptyState?: React.ReactNode;
  className?: string;
  /** Disable inner scroll — use inside modals or short lists */
  compact?: boolean;
}>) {
  if (!rows.length) {
    if (typeof emptyState === "string") {
      return (
        <div className={cn("min-w-0", className)}>
          <CmmsEmptyState title={emptyState} />
        </div>
      );
    }
    if (emptyState) {
      return <div className={cn("min-w-0", className)}>{emptyState}</div>;
    }
    return (
      <div className={cn("min-w-0", className)}>
        <CmmsEmptyState title="No records yet" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      <div className={cn(!compact && "max-h-[min(70vh,640px)] overflow-auto")}>
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-[1] bg-[var(--surface-muted)] text-[var(--muted-foreground)]">
            <tr>
              {columns.map((column, columnIndex) => (
                <th
                  key={column.key ?? `${column.header}-${columnIndex}`}
                  className={cn(
                    "cmms-text-label px-4 py-3.5 uppercase tracking-wide",
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="cmms-interactive border-t border-[var(--border)] align-top text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
              >
                {columns.map((column, columnIndex) => (
                  <td
                    key={column.key ?? `${column.header}-${columnIndex}`}
                    className={cn("px-4 py-3.5 leading-relaxed", column.className)}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
