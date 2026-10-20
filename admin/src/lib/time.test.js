// @vitest-environment node
import { afterAll, describe, expect, it } from "vitest";
import { addDays, dayToLocalDate, fmtISTDateTime, fromIstInput, istDay, istEndOfDay, istStartOfDay, localDateToDay, toIstInput } from "./time";
import { fmtDate } from "./api";
import { formatDate } from "../utils/utils";
import { rangeFromDays } from "../components/analytics/RangePicker";

const original = process.env.TZ;
afterAll(() => { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; });

// the same moment, seen from browsers in very different time zones, must give the same IST answers
const ZONES = ["UTC", "Asia/Kolkata", "America/Los_Angeles", "Asia/Tokyo", "Pacific/Auckland", "Europe/London"];
// 2026-10-16 20:30 UTC  =  2026-10-17 02:00 IST  (a different calendar day in IST than in UTC / the US)
const MOMENT = new Date("2026-10-16T20:30:00Z");

describe.each(ZONES)("time helpers in a browser set to %s", (tz) => {
  it("shows the IST day, date and time of an instant", () => {
    process.env.TZ = tz;
    expect(istDay(MOMENT)).toBe("2026-10-17");
    expect(fmtDate(MOMENT, true)).toMatch(/17 Oct 2026/);
    expect(fmtDate(MOMENT, true)).toMatch(/02:00\s?am/i);
    expect(formatDate(MOMENT)).toMatch(/17 Oct 2026/);
    expect(fmtISTDateTime(MOMENT)).toMatch(/17 Oct 2026.*02:00/i);
  });

  it("a day sent to the API is the IST day; start / end of day are exact IST instants", () => {
    process.env.TZ = tz;
    expect(istStartOfDay("2026-10-17").toISOString()).toBe("2026-10-16T18:30:00.000Z");
    expect(istEndOfDay("2026-10-17").toISOString()).toBe("2026-10-17T18:29:59.999Z");
  });

  it("date-and-time typed by an editor means IST, and reads back the same", () => {
    process.env.TZ = tz;
    const typed = "2026-10-20T10:48";
    const instant = fromIstInput(typed);
    expect(instant.toISOString()).toBe("2026-10-20T05:18:00.000Z");     // 10:48 IST
    expect(toIstInput(instant)).toBe(typed);
  });

  it("calendar days survive the round trip through local Date objects", () => {
    process.env.TZ = tz;
    for (const day of ["2026-01-01", "2026-03-29", "2026-10-25", "2026-12-31"]) expect(localDateToDay(dayToLocalDate(day))).toBe(day);
  });

  it("day arithmetic and the quick ranges never skip or repeat a day", () => {
    process.env.TZ = tz;
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    const r = rangeFromDays(30);
    expect(r.to).toBe(istDay());
    expect(addDays(r.from, 29)).toBe(r.to);
  });
});
