/** Message to show for any failed request. */
export const errMsg = (e, fallback = "Something went wrong") => e?.response?.data?.message || e?.message || fallback;

/** Drops empty values from a params object (so ?search= is not sent). */
export const cleanParams = (o = {}) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v !== undefined && v !== null && v !== "all"));

export const fmtDate = (d, withTime = false) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: true } : {}) }).format(date);
};

export const fmtDuration = (sec = 0) => {
  const s = Math.round(sec);
  if (!s) return "—";
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
};

export const fmtBytes = (n = 0) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n > 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`);
