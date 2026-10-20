import { useMemo, useState } from "react";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import { hi as hiLocale, enUS } from "date-fns/locale";
import { CalendarRange, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "../../styles/daterange.css";
import { cn } from "../../lib/cn";
import { addDays, dayToLocalDate, istDay, localDateToDay } from "../../lib/time";
import Button from "./Button";
import Modal from "./Modal";

const toDate = (s) => (s ? dayToLocalDate(s) : null);
const label = (d, locale) => format(d, "d MMM yyyy", { locale });

/** Preset ranges as IST calendar days (so "Today" is today in India, not in the browser's time zone). */
const presets = () => {
  const today = istDay();
  const [y, m] = today.split("-").map(Number);
  const first = `${y}-${String(m).padStart(2, "0")}-01`;
  const prevFirst = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, "0")}-01`;
  return [
    ["Today", today, today],
    ["Yesterday", addDays(today, -1), addDays(today, -1)],
    ["Last 7 days", addDays(today, -6), today],
    ["Last 30 days", addDays(today, -29), today],
    ["This month", first, today],
    ["Last month", prevFirst, addDays(first, -1)],
  ];
};

/**
 * Date range filter (react-date-range inside a popup: a bottom sheet on phones).
 *   <DateRangeFilter value={{ from: "2026-10-01", to: "2026-10-14" }} onChange={({ from, to }) => …} />
 * Values are plain "YYYY-MM-DD" strings (IST days) — exactly what the API's ?from= & ?to= expect. Empty strings = no filter.
 */
export default function DateRangeFilter({ value, onChange, className, maxDate, placeholder, compact }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "hi" ? hiLocale : enUS;
  const [open, setOpen] = useState(false);
  const from = toDate(value?.from); const to = toDate(value?.to);
  const todayLocal = dayToLocalDate(istDay());
  const [draft, setDraft] = useState([{ startDate: from || todayLocal, endDate: to || from || todayLocal, key: "selection" }]);

  const openPicker = () => { setDraft([{ startDate: from || todayLocal, endDate: to || from || todayLocal, key: "selection" }]); setOpen(true); };
  const apply = (s, e) => { onChange({ from: s, to: e }); setOpen(false); };
  const sel = draft[0];
  const presetList = useMemo(() => (open ? presets() : []), [open]);
  const active = Boolean(from || to);
  const text = active ? `${from ? label(from, locale) : "…"} – ${to ? label(to, locale) : "…"}` : (placeholder || t("Any date"));

  return (
    <>
      <div className={cn("relative inline-flex", className)}>
        <button type="button" onClick={openPicker} aria-haspopup="dialog"
          className={cn("inline-flex h-10 w-full items-center gap-2 rounded-control border bg-surface px-3 text-sm transition-colors focus-ring hover:bg-surface-2", active ? "border-primary/50 text-fg" : "border-line-strong text-fg-subtle", active && !compact && "pr-9")}>
          <CalendarRange className={cn("size-4 shrink-0", active && "text-primary")} aria-hidden />
          <span className="truncate">{text}</span>
        </button>
        {active && (
          <button type="button" aria-label={t("Clear")} onClick={() => onChange({ from: "", to: "" })} className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-fg-subtle hover:bg-surface-3 hover:text-fg">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t("Date range")} icon={CalendarRange} size="md"
        footer={<>
          <Button variant="ghost" onClick={() => { onChange({ from: "", to: "" }); setOpen(false); }}>{t("Clear")}</Button>
          <Button onClick={() => apply(localDateToDay(sel.startDate), localDateToDay(sel.endDate || sel.startDate))}>{t("Apply")}</Button>
        </>}>
        <div className="flex flex-wrap gap-1.5 pb-3">
          {presetList.map(([name, s, e]) => (
            <button key={name} type="button" onClick={() => apply(s, e)} className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-fg-muted transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary">{t(name)}</button>
          ))}
        </div>
        <div className="drf">
          <DateRange
            ranges={draft}
            onChange={(r) => setDraft([r.selection])}
            moveRangeOnFirstSelection={false}
            editableDateInputs
            months={1}
            direction="vertical"
            scroll={{ enabled: false }}
            maxDate={maxDate || todayLocal}
            rangeColors={["var(--primary)"]}
            locale={locale}
            showMonthAndYearPickers
            weekStartsOn={1}
          />
        </div>
      </Modal>
    </>
  );
}
