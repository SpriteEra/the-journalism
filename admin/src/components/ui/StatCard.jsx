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
 */
export default function StatCard({ label, value, icon: Icon, tone = "primary", change, hint, loading, className, spark, rows, invert }) {
  const up = change > 0; const flat = !change;
  const good = flat ? null : invert ? !up : up;
  const [tile, color] = TONES[tone] || TONES.primary;
  const gid = `g${label?.replace(/\W/g, "")}${tone}`;
  return (
    <div className={cn("surface-card flex flex-col gap-3 p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        {Icon ? <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg shadow-sm", tile)}><Icon className="size-5" strokeWidth={2} /></span> : <span />}
        {change !== undefined && !loading && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-medium", flat ? "bg-surface-3 text-fg-subtle" : good ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
            {!flat && (up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />)}{Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-fg-subtle">{label}</p>
        {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-0.5 text-2xl font-semibold tracking-tight text-fg sm:text-[1.7rem]">{typeof value === "number" ? value.toLocaleString("en-IN") : value}</p>}
        {hint && <p className="mt-0.5 truncate text-xs text-fg-subtle">{hint}</p>}
      </div>
      {spark?.length > 1 && (
        <div className="-mx-1 h-14" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark.map((v, i) => ({ i, v }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.28} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {rows?.length > 0 && (
        <dl className="space-y-1 border-t border-line pt-3 text-xs">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-2"><dt className="text-fg-subtle">{k}</dt><dd className="font-medium text-fg">{v}</dd></div>)}
        </dl>
      )}
    </div>
  );
}
