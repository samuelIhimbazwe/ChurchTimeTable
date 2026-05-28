import { cn } from "@/core/utils/cn";

export interface CmmsTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

export function CmmsTable<T>({
  columns,
  rows,
  emptyState,
  className,
}: Readonly<{
  columns: CmmsTableColumn<T>[];
  rows: T[];
  emptyState?: React.ReactNode;
  className?: string;
}>) {
  if (!rows.length) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]",
          className,
        )}
      >
        {emptyState ?? "No records available."}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)]",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-[var(--surface-muted)] text-[var(--muted-foreground)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 font-semibold uppercase tracking-wide text-xs",
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
                className="border-t border-[var(--border)] align-top text-[var(--foreground)]"
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-4 py-3", column.className)}>
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
