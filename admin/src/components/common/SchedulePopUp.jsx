import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarDays, Clock3 } from "lucide-react";
import Modal from "../ui/Modal";
import { Button } from "../ui";
import CustomDropdown from "./CustomeDropDown";
import { cn } from "../../lib/cn";

// local calendar date as YYYY-MM-DD (toISOString would shift the day for IST mornings)
const toLocalISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return toLocalISO(d); };

// "09:15 PM" -> minutes since midnight
const toMinutes = (label) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label || "");
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]);
};

const QUICK_TIMES = ["09:00 AM", "12:00 PM", "06:00 PM", "09:00 PM"];

const Chip = ({ active, children, ...props }) => (
  <button
    type="button"
    aria-pressed={active}
    className={cn(
      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-ring",
      active ? "border-fg bg-fg text-canvas" : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg"
    )}
    {...props}
  >
    {children}
  </button>
);

const SchedulePopUp = ({
  popupOpen,
  setPopUpOpen,
  handleSchedule,
  post_time,
  handleTimeChange,
  handleDateChange,
  selectedTimeIndex,
  timeOptions,
}) => {
  const timeToIndexMap = useMemo(
    () => timeOptions.reduce((acc, time, index) => { acc[time] = index; return acc; }, {}),
    [timeOptions]
  );

  const today = toLocalISO(new Date());
  const [dateValue, setDateValue] = useState(post_time?.date ? toLocalISO(new Date(post_time.date)) : today);
  const [timeIndex, setTimeIndex] = useState(selectedTimeIndex);
  const [saving, setSaving] = useState(false);

  // every time the popup opens: sync from the story, and make sure the parent has a date
  useEffect(() => {
    if (!popupOpen) return;
    const date = post_time?.date ? toLocalISO(new Date(post_time.date)) : today;
    setDateValue(date);
    if (!post_time?.date) handleDateChange(date);
    setTimeIndex(timeToIndexMap[post_time?.time] !== undefined ? timeToIndexMap[post_time.time] : selectedTimeIndex);
  }, [popupOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickDate = (value) => {
    if (!value) return;
    setDateValue(value);
    handleDateChange(value);
  };
  const pickTime = (index) => {
    setTimeIndex(index);
    handleTimeChange(index);
  };

  const timeChosen = Boolean(post_time?.time);
  const chosenLabel = timeOptions[timeIndex];

  // is the chosen moment already gone?
  const inPast = useMemo(() => {
    if (!timeChosen || dateValue !== today) return false;
    const mins = toMinutes(chosenLabel);
    const now = new Date();
    return mins !== null && mins <= now.getHours() * 60 + now.getMinutes();
  }, [timeChosen, dateValue, today, chosenLabel]);

  const summary = useMemo(() => {
    if (!dateValue || !timeChosen) return null;
    const [y, m, d] = dateValue.split("-").map(Number);
    const text = new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return `${text} at ${chosenLabel}`;
  }, [dateValue, timeChosen, chosenLabel]);

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try { await handleSchedule(); } finally { setSaving(false); }
  };

  return (
    <Modal
      open={popupOpen}
      onClose={() => setPopUpOpen(false)}
      title="Schedule post"
      description="Choose when this story should go live."
      icon={CalendarClock}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={() => setPopUpOpen(false)} disabled={saving}>Back</Button>
          <Button leftIcon={CalendarClock} loading={saving} disabled={!timeChosen || inPast} onClick={submit}>Schedule</Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* date */}
        <section>
          <label htmlFor="schedule-date" className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
            <CalendarDays className="size-4 text-fg-subtle" /> Date
          </label>
          <input
            id="schedule-date"
            type="date"
            value={dateValue}
            min={today}
            onChange={(e) => pickDate(e.target.value)}
            className="h-10 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-fg focus-ring"
          />
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Chip active={dateValue === today} onClick={() => pickDate(today)}>Today</Chip>
            <Chip active={dateValue === addDays(1)} onClick={() => pickDate(addDays(1))}>Tomorrow</Chip>
            <Chip active={dateValue === addDays(7)} onClick={() => pickDate(addDays(7))}>In a week</Chip>
          </div>
        </section>

        {/* time */}
        <section>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
            <Clock3 className="size-4 text-fg-subtle" /> Time <span className="text-xs font-normal text-fg-subtle">(IST)</span>
          </p>
          <CustomDropdown options={timeOptions} selectedOption={timeIndex} onSelectOption={pickTime} />
          <div className="mt-2.5 flex flex-wrap gap-2">
            {QUICK_TIMES.filter((t) => timeToIndexMap[t] !== undefined).map((t) => (
              <Chip key={t} active={timeChosen && timeIndex === timeToIndexMap[t]} onClick={() => pickTime(timeToIndexMap[t])}>{t}</Chip>
            ))}
          </div>
        </section>

        {/* result */}
        <div className={cn("rounded-xl border p-3 text-sm", inPast ? "border-warning/40 bg-warning-soft text-fg" : "border-line bg-surface-2/60 text-fg-muted")}>
          {inPast ? (
            <>That time has already passed today. Pick a later time or another date.</>
          ) : summary ? (
            <>Goes live on <b className="text-fg">{summary}</b>.</>
          ) : (
            <>Pick a time to see when the story will go live.</>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SchedulePopUp;