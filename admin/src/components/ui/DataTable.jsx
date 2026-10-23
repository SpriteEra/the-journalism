import { cn } from "../../lib/cn";
import { EmptyState, Skeleton } from "./Feedback";

/**
 * Responsive table. Table from the breakpoint up, list of cards below it.
 *
 * columns = [{ key, header, cell?: (row)=>node, className?, hideOnMobile?, primary?, align?: 'right' }]
 *
 *   <DataTable columns rows loading rowKey="_id" empty={<EmptyState/>} onRowClick />
 *
 * mobileCard   (row, i) => node   optional. Replaces the default label/value card below the breakpoint
 *                                 (e.g. <VideoCard/>). Without it nothing changes for existing pages.
 * breakpoint   "md" (default) | "sm"   where the table takes over from the cards.
 * contained    the table is its own scroll area with a sticky header (toolbar above, pagination below).
 */
const BP = {
  md: { table: "hidden md:block", list: "md:hidden" },
  sm: { table: "hidden sm:block", list: "sm:hidden" },
};


export default function DataTable({ columns, rows = [], loading, rowKey = "_id", skeletonRows = 6, empty, onRowClick, className, dense, contained = false, mobileCard, breakpoint = "md" }) {
  const bp = BP[breakpoint] || BP.md;
  const cell = (c, row, i) => (c.cell ? c.cell(row, i) : row[c.key] ?? "—");
  const cols = columns.filter(Boolean);
  const primary = cols.find((c) => c.primary) || cols[0];

  if (!loading && !rows.length) {
    const node = empty ?? <EmptyState />;
    return contained
      ? <div className={cn("grid min-h-0 flex-1 place-items-center overflow-auto", className)}>{node}</div>
      : node;
  }

  return (
    <div className={cn("w-full", contained && "min-h-0 flex-1 overflow-auto", className)}>
      {/* table */}
      <div className={cn(bp.table, !contained && "overflow-x-auto")}>
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              {cols.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 whitespace-nowrap",
                    contained && "sticky top-0 z-10 bg-surface-2 shadow-[inset_0_-1px_0_var(--line,theme(colors.line))]",
                    c.align === "right" && "text-right",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading
              ? Array.from({ length: skeletonRows }).map((_, r) => (
                <tr key={r}>{cols.map((c) => <td key={c.key} className="px-4 py-3.5"><Skeleton className="h-4 w-full max-w-40" /></td>)}</tr>
              ))
              : rows.map((row, i) => (
                <tr
                  key={row[rowKey] ?? i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn("transition-colors hover:bg-surface-2/60", onRowClick && "cursor-pointer")}
                >
                  {cols.map((c) => (
                    <td key={c.key} className={cn("px-4 align-middle text-fg-muted", dense ? "py-2" : "py-3", c.align === "right" && "text-right", c.className)}>{cell(c, row, i)}</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* cards */}
      <ul className={cn(bp.list, mobileCard ? "space-y-2 mt-2" : "divide-y divide-line")}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            mobileCard
              ? <li key={i}><Skeleton className="h-24 w-full rounded-xl" /></li>
              : <li key={i} className="space-y-2 p-4"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></li>
          ))
          : rows.map((row, i) =>
            mobileCard ? (
              <li key={row[rowKey] ?? i}>{mobileCard(row, i)}</li>
            ) : (
              <li key={row[rowKey] ?? i} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn("space-y-2.5 p-2 sm:p-4", onRowClick && "cursor-pointer active:bg-surface-2")}>
                <div className="text-sm font-semibold text-fg">{cell(primary, row, i)}</div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  {cols.filter((c) => c !== primary && !c.hideOnMobile).map((c) => (
                    <div key={c.key} className="contents">
                      <dt className="text-xs text-fg-subtle">{c.header}</dt>
                      <dd className={cn("min-w-0 text-fg-muted", c.align === "right" && "justify-self-end")}>{cell(c, row, i)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            )
          )}
      </ul>
    </div>
  );
}