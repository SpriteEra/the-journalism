import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { istDay, istDayBounds, istEndOfDay, istStartOfDay, parseRange } from '../utils/dateRange.js';
import { parseFeatured } from '../utils/featured.js';

/**
 * The newsroom day is the IST day. A cloud server normally runs in UTC (or anywhere else), so none of these answers may depend on the
 * server's own time zone. Each test is run with the process pretending to be in a different zone.
 */
const original = process.env.TZ;
after(() => { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; });
const ZONES = ['UTC', 'Asia/Kolkata', 'America/New_York', 'Asia/Tokyo', 'Pacific/Auckland'];

for (const tz of ZONES) {
    test(`IST days do not depend on the server time zone (${tz})`, () => {
        process.env.TZ = tz;
        // 2026-10-16 20:30 UTC is already 17 Oct 02:00 in India
        const moment = new Date('2026-10-16T20:30:00Z');
        assert.equal(istDay(moment), '2026-10-17');

        const { start, end } = istDayBounds('2026-10-17');
        assert.equal(start.toISOString(), '2026-10-16T18:30:00.000Z');
        assert.equal(end.toISOString(), '2026-10-17T18:29:59.999Z');
        assert.deepEqual(istDayBounds(moment), { start, end });                       // an instant resolves to its IST day
        assert.deepEqual(istDayBounds('2026-10-17T01:00:00+05:30'), { start, end });
        assert.throws(() => istDayBounds('not a date'), /Invalid date/);

        const r = parseRange({ from: '2026-10-01', to: '2026-10-07' });
        assert.equal(r.start.toISOString(), istStartOfDay('2026-10-01').toISOString());
        assert.equal(r.end.toISOString(), istEndOfDay('2026-10-07').toISOString());
        assert.equal(r.days, 7);
        assert.equal(r.fromDay, '2026-10-01');
        assert.equal(r.toDay, '2026-10-07');
    });

    test(`featured "until" is an exact instant (${tz})`, () => {
        process.env.TZ = tz;
        const now = new Date('2026-10-17T00:00:00Z');
        const f = parseFeatured({ enabled: true, until: '2026-10-20T05:18:00.000Z' }, now);
        assert.equal(f.until.toISOString(), '2026-10-20T05:18:00.000Z');
    });
}

test('the story-day boundaries line up with consecutive IST days (no gap, no overlap)', () => {
    for (const day of ['2026-02-28', '2026-03-01', '2026-10-31', '2026-12-31']) {
        const a = istDayBounds(day);
        const [y, m, d] = day.split('-').map(Number);
        const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
        assert.equal(istDayBounds(next).start.getTime() - a.end.getTime(), 1);
    }
});
