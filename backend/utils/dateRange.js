import ErrorHandler from './errorHandler.js';

export const TZ = 'Asia/Kolkata';
export const DAY = 86400000;
const IST_OFFSET_MS = 5.5 * 3600000;

/** 'YYYY-MM-DD' for an instant, in IST. */
export const istDay = (d = new Date()) => new Date(new Date(d).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
export const istStartOfDay = (day) => new Date(`${day}T00:00:00+05:30`);
export const istEndOfDay = (day) => new Date(`${day}T23:59:59.999+05:30`);

/**
 * Start and end instants of the IST day of `value` ('YYYY-MM-DD' or any date). The server's own time zone never matters
 * (a cloud server usually runs in UTC, which would shift every "this day" filter by 5½ hours).
 */
export const istDayBounds = (value) => {
    const isDay = /^\d{4}-\d{2}-\d{2}$/.test(String(value));
    if (!isDay && Number.isNaN(new Date(value).getTime())) throw new ErrorHandler(400, 'Invalid date');
    const day = isDay ? String(value) : istDay(new Date(value));
    if (Number.isNaN(istStartOfDay(day).getTime())) throw new ErrorHandler(400, 'Invalid date');
    return { start: istStartOfDay(day), end: istEndOfDay(day) };
};

/**
 * ?from=YYYY-MM-DD&to=YYYY-MM-DD  (default: last `defaultDays` days ending now, IST day boundaries, max `maxDays`)
 * Also returns the equally long previous period for "vs previous" comparisons.
 */
export const parseRange = (q = {}, { defaultDays = 30, maxDays = 366 } = {}) => {
    const dayRe = /^\d{4}-\d{2}-\d{2}$/;
    if ((q.from && !dayRe.test(q.from)) || (q.to && !dayRe.test(q.to))) throw new ErrorHandler(400, 'from / to must look like YYYY-MM-DD');
    const end = q.to ? istEndOfDay(q.to) : new Date();
    const start = q.from ? istStartOfDay(q.from) : istStartOfDay(istDay(new Date(end.getTime() - (defaultDays - 1) * DAY)));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new ErrorHandler(400, 'Invalid from/to date');
    if (start > end) throw new ErrorHandler(400, '`from` must be before `to`');
    if (end - start > maxDays * DAY) throw new ErrorHandler(400, `Range cannot exceed ${maxDays} days`);
    const days = Math.max(1, Math.ceil((end - start) / DAY));
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(start.getTime() - (end - start) - 1);
    return { start, end, days, prevStart, prevEnd, fromDay: istDay(start), toDay: istDay(end) };
};
