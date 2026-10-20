/**
 * One place for dates. The newsroom works in Indian Standard Time (IST, UTC+05:30, no daylight saving), whatever time zone the
 * browser or the server runs in:
 *   - every date SHOWN is written in IST
 *   - a "day" sent to the API is a plain YYYY-MM-DD meaning that IST day
 *   - a "date and time" typed by an editor (e.g. "feature until") means IST wall-clock time and is sent as an exact instant
 */
export const IST = "Asia/Kolkata";
const OFFSET = "+05:30";

const parts = (date, opts) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: IST, hourCycle: "h23", ...opts }).formatToParts(date).map((p) => [p.type, p.value]));

/** the IST calendar day of an instant: "2026-10-17" */
export const istDay = (value = new Date()) => {
  const p = parts(new Date(value), { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${p.year}-${p.month}-${p.day}`;
};

/** "2026-10-17" ± n days (pure calendar arithmetic, no time zone involved) */
export const addDays = (day, n) => {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
};

/** calendar widgets work with local Dates: a Date whose LOCAL y/m/d equal the given day (and back) */
export const dayToLocalDate = (day) => { const [y, m, d] = day.split("-").map(Number); return new Date(y, m - 1, d); };
export const localDateToDay = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** exact instants of the start / end of an IST day */
export const istStartOfDay = (day) => new Date(`${day}T00:00:00.000${OFFSET}`);
export const istEndOfDay = (day) => new Date(`${day}T23:59:59.999${OFFSET}`);

/** value for <input type="datetime-local"> showing an instant in IST: "2026-10-17T10:48" */
export const toIstInput = (value = new Date()) => {
  const p = parts(new Date(value), { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};
/** the instant meant by what the editor typed in a datetime-local input (IST wall-clock) */
export const fromIstInput = (v) => new Date(`${v}:00${OFFSET}`);

/** display helpers, always IST */
export const fmtIST = (value, opts) => (value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat("en-IN", { timeZone: IST, ...opts }).format(new Date(value)) : "—");
export const fmtISTDate = (value) => fmtIST(value, { day: "2-digit", month: "short", year: "numeric" });
export const fmtISTDateTime = (value) => fmtIST(value, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
export const fmtISTTime = (value) => fmtIST(value, { hour: "2-digit", minute: "2-digit", hour12: true });
