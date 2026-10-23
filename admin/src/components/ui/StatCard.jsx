import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "../../lib/cn";
import { Skeleton } from "./Feedback";

// solid colour tile + matching chart colour (same palette as the charts)
const TONES = {
  primary: ["bg-primary text-primary-fg", "var(--fg)"], accent: ["bg-accent text-accent-fg", "var(--chart-2)"], success: ["bg-success text-paper", "var(--chart-2)"],
  warning: ["bg-warning text-paper", "var(--chart-3)"], info: ["bg-info text-paper", "var(--chart-1)"], danger: ["bg-danger text-paper", "var(--danger)"],
  violet: ["bg-chart-4 text-paper", "var(--chart-4)"], pink: ["bg-chart-5 text-paper", "var(--chart-5)"],
};

/**
 * KPI card (icon tile, trend pill, value, optional sparkline and footer rows).
 *   change = percent vs previous period · spark = number[] · rows = [[label, value], …] · invert = a fall is good (e.g. at-risk deals)
 *
 * Sizes are mobile-first: compact below `sm` so two cards fit side by side on a phone; from `sm` up it is the original size.
 */
export default function StatCard({ label, value, icon: Icon, tone = "primary", change, hint, loading, className, spark, rows, invert }) {
  const up = change > 0; const flat = !change;
  const good = flat ? null : invert ? !up : up;
  const [tile, color] = TONES[tone] || TONES.primary;
  const gid = `g${label?.replace(/\W/g, "")}${tone}`;
  return (
    <div className={cn("surface-card flex min-w-0 flex-col gap-2 p-3 sm:gap-3 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {Icon ? <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg shadow-sm sm:size-11", tile)}><Icon className="size-4 sm:size-5" strokeWidth={2} /></span> : <span />}
        {change !== undefined && !loading && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium sm:px-2 sm:py-1 sm:text-xs", flat ? "bg-surface-3 text-fg-subtle" : good ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
            {!flat && (up ? <ArrowUpRight className="size-3 sm:size-3.5" /> : <ArrowDownRight className="size-3 sm:size-3.5" />)}{Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-fg-subtle sm:text-sm">{label}</p>
        {loading ? <Skeleton className="mt-2 h-7 w-20 sm:h-8 sm:w-24" /> : <p className="mt-0.5 truncate text-xl font-semibold tracking-tight text-fg sm:text-[1.7rem]">{typeof value === "number" ? value.toLocaleString("en-IN") : value}</p>}
        {hint && <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-fg-subtle sm:truncate sm:text-xs">{hint}</p>}
      </div>
      {spark?.length > 1 && (
        <div className="-mx-1 h-10 sm:h-14" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark.map((v, i) => ({ i, v }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.28} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {rows?.length > 0 && (
        <dl className="space-y-1 border-t border-line pt-2 text-[11px] sm:pt-3 sm:text-xs">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-2"><dt className="truncate text-fg-subtle">{k}</dt><dd className="shrink-0 font-medium text-fg">{v}</dd></div>)}
        </dl>
      )}
    </div>
  );
}