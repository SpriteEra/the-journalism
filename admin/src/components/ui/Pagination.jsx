import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import Select from "./Select";

/** Compact page list: 1 … 4 5 6 … 20 */
export const pageWindow = (page, pages, around = 1) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page]);
  for (let i = 1; i <= around; i++) { set.add(page - i); set.add(page + i); }
  const list = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  list.forEach((n, i) => { if (i && n - list[i - 1] > 1) out.push("…"); out.push(n); });
  return out;
};

/**
 * <Pagination page total limit onPage onLimit limits=[10,20,50] /> – total = number of records
 * Phone: one slim row – "1–20 of 120" on the left, ‹ 3 / 6 › on the right.
 * sm and up: full page list and the rows-per-page select.
 */
export default function Pagination({ page = 1, total = 0, limit = 10, onPage, onLimit, limits = [10, 20, 50], className }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, total);
  const btn = "grid size-8 place-items-center rounded-lg text-sm transition-colors focus-ring disabled:pointer-events-none disabled:opacity-40";
  const arrow = cn(btn, "text-fg-muted hover:bg-surface-2");

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-3", className)}>
      {/* summary */}
      <p className="min-w-0 truncate text-xs text-fg-subtle sm:text-sm">
        {total ? (
          <>
            <span className="sm:hidden"><b className="font-medium text-fg">{from}–{to}</b> of {total}</span>
            <span className="hidden sm:inline">Showing <b className="font-medium text-fg">{from}–{to}</b> of <b className="font-medium text-fg">{total}</b></span>
          </>
        ) : "No results"}
      </p>

      {/* phone: prev  3 / 6  next */}
      <div className="flex shrink-0 items-center gap-0.5 sm:hidden">
        <button className={cn(arrow, "border border-line")} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
        <span className="min-w-14 text-center text-xs tabular-nums text-fg-subtle" aria-live="polite"><b className="font-semibold text-fg">{page}</b> / {pages}</span>
        <button className={cn(arrow, "border border-line")} onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page"><ChevronRight className="size-4" /></button>
      </div>

      {/* sm and up: full controls */}
      <div className="hidden shrink-0 items-center gap-3 sm:flex">
        {onLimit && (
          <div className="w-36 shrink-0">
            <Select size="sm" aria-label="Rows per page" value={limit} onChange={(e) => onLimit(Number(e.target.value))} options={limits.map((l) => ({ value: l, label: `${l} / page` }))} />
          </div>
        )}
        <div className="flex items-center gap-1">
          <button className={arrow} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
          {pageWindow(page, pages).map((n, i) =>
            n === "…" ? <span key={`e${i}`} className="px-1 text-fg-faint">…</span> : (
              <button key={n} onClick={() => onPage(n)} aria-current={n === page ? "page" : undefined}
                className={cn(btn, "min-w-8 px-2", n === page ? "bg-primary text-primary-fg" : "text-fg-muted hover:bg-surface-2")}>{n}</button>
            )
          )}
          <button className={arrow} onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page"><ChevronRight className="size-4" /></button>
        </div>
      </div>
    </nav>
  );
}