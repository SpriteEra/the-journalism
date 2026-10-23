import { useState } from "react";
import { CalendarDays, CalendarRange, Check } from "lucide-react";
import { cn } from "../../lib/cn";
import DateRangeFilter from "../ui/DateRangeFilter";
import RowMenu from "../common/RowMenu";
import { addDays, istDay } from "../../lib/time";

export const rangeFromDays = (days) => { const to = istDay(); return { from: addDays(to, -(days - 1)), to }; };

const PRESETS = [7, 30, 90, 365];
const shortLabel = (d) => (d === 365 ? "12m" : `${d}d`);
const longLabel = (d) => (d === 365 ? "Last 12 months" : `Last ${d} days`);

/**
 * Quick presets (7 / 30 / 90 days / 12 months) + a calendar popup for any custom range.
 * onChange({from,to}) = YYYY-MM-DD (IST).
 *
 * compact (opt-in, default false): below sm the picker collapses into one small calendar button
 * that opens a menu (every preset + "Custom range"). Without it the picker looks the same everywhere, as before.
 */
export default function RangePicker({ value, onChange, compact = false }) {
  const [preset, setPreset] = useState(30);
  const [custom, setCustom] = useState(false);

  const pick = (d) => { setPreset(d); setCustom(false); onChange(rangeFromDays(d)); };

  const full = (
    <div className={cn("flex-wrap items-center gap-2", compact ? "hidden sm:flex" : "flex")}>
      <div className="inline-flex rounded-full border border-line bg-surface p-1" role="group" aria-label="Quick range">
        {PRESETS.map((d) => (
          <button key={d} type="button" aria-pressed={preset === d} onClick={() => pick(d)}
            className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", preset === d ? "bg-primary text-primary-fg" : "text-fg-muted hover:text-fg")}>{shortLabel(d)}</button>
        ))}
      </div>
      <DateRangeFilter className="w-full min-w-64 sm:w-72" value={value} onChange={(r) => { if (r.from && r.to) { setPreset(0); onChange(r); } }} />
    </div>
  );

  if (!compact) return full;

  const items = [
    ...PRESETS.map((d) => ({ label: longLabel(d), icon: preset === d ? Check : CalendarDays, onClick: () => pick(d) })),
    { label: "Custom range", icon: preset === 0 ? Check : CalendarRange, onClick: () => setCustom(true) },
  ];

  return (
    <>
      {/* below sm: compact menu */}
      <div className="relative flex items-center gap-2 sm:hidden">
        <span className="text-xs font-medium text-fg-muted">{preset ? shortLabel(preset) : "Custom"}</span>
        <RowMenu variant="filled" icon={CalendarDays} items={items} />

        {custom && (
          <>
            <button type="button" aria-label="Close" tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setCustom(false)} />
            <div className="absolute right-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-3 shadow-lg">
              <p className="mb-2 text-xs font-medium text-fg-muted">Custom range</p>
              <DateRangeFilter
                className="w-full min-w-0"
                value={value}
                onChange={(r) => { if (r.from && r.to) { setPreset(0); setCustom(false); onChange(r); } }}
              />
            </div>
          </>
        )}
      </div>

      {/* sm and up: the normal picker */}
      {full}
    </>
  );
}