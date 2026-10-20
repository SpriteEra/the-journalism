import { useState } from "react";
import { cn } from "../../lib/cn";
import DateRangeFilter from "../ui/DateRangeFilter";
import { addDays, istDay } from "../../lib/time";

export const rangeFromDays = (days) => { const to = istDay(); return { from: addDays(to, -(days - 1)), to }; };

const PRESETS = [7, 30, 90, 365];

/** Quick presets (7 / 30 / 90 days / 12 months) + a calendar popup for any custom range. onChange({from,to}) = YYYY-MM-DD (IST). */
export default function RangePicker({ value, onChange }) {
  const [preset, setPreset] = useState(30);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-full border border-line bg-surface p-1" role="group" aria-label="Quick range">
        {PRESETS.map((d) => (
          <button key={d} type="button" aria-pressed={preset === d} onClick={() => { setPreset(d); onChange(rangeFromDays(d)); }}
            className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", preset === d ? "bg-primary text-primary-fg" : "text-fg-muted hover:text-fg")}>{d === 365 ? "12m" : `${d}d`}</button>
        ))}
      </div>
      <DateRangeFilter className="w-full min-w-64 sm:w-72" value={value} onChange={(r) => { if (r.from && r.to) { setPreset(0); onChange(r); } }} />
    </div>
  );
}
