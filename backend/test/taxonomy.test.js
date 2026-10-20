import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { toIdList } from '../utils/newsTaxonomy.js';
import News from '../model/news.models.js';
import Role from '../model/role.model.js';
import ScheduleNews from '../model/scheduleNews.model.js';
import { parseRange } from '../utils/dateRange.js';

const oid = () => new mongoose.Types.ObjectId();

test('toIdList accepts every shape the admin panel may send', () => {
    const a = String(oid()); const b = String(oid());
    assert.deepEqual(toIdList(undefined), []);
    assert.deepEqual(toIdList(''), []);
    assert.deepEqual(toIdList('null'), []);
    assert.deepEqual(toIdList(a), [a]);
    assert.deepEqual(toIdList(`${a},${b}`), [a, b]);
    assert.deepEqual(toIdList(JSON.stringify([a, b, a])), [a, b]);           // JSON string + de-dupe
    assert.deepEqual(toIdList([a, { _id: b }]), [a, b]);                     // populated objects
    assert.deepEqual(toIdList('[]'), []);                                    // sub-category may be an empty array
    assert.throws(() => toIdList('not-an-id', 'category'), /Invalid category id/);
    assert.throws(() => toIdList('[oops', 'category'), /valid JSON array/);
});

test('News schema: state / district / category / subCategory are ObjectId arrays; section is gone', () => {
    const paths = News.schema.paths;
    for (const f of ['category', 'subCategory', 'state', 'district']) {
        assert.equal(paths[f].instance, 'Array', f);
        assert.equal(paths[f].caster.instance, 'ObjectId', f);
    }
    assert.equal(paths.news_section_type, undefined);
    assert.equal(ScheduleNews.schema.paths.news_section_type, undefined);
    assert.deepEqual(new News().subCategory.toObject(), []);                 // defaults to an empty array
});

const base = () => ({ news_id: 'n', title: 't', author: oid(), update_stack: oid(), tags: [oid()] });

test('published news needs at least one category; drafts and empty sub-category are fine', async () => {
    await assert.rejects(new News({ ...base(), draft: false }).validate(), /At least one category is required/);
    await assert.rejects(new News({ ...base(), draft: false, category: [] }).validate(), /At least one category is required/);
    await new News({ ...base(), draft: false, category: [oid()], subCategory: [] }).validate();      // ok
    await new News({ ...base(), draft: true }).validate();                                           // draft without category ok
    await new News({ ...base(), draft: false, category: [oid()], subCategory: [oid()], state: [oid()], district: [oid(), oid()] }).validate();
});

test('published news needs at least one tag; drafts do not; max 20', async () => {
    const noTags = { news_id: 'n', title: 't', author: oid(), update_stack: oid(), category: [oid()] };
    await assert.rejects(new News({ ...noTags, draft: false }).validate(), /At least one tag is required/);
    await new News({ ...noTags, draft: true }).validate();
    await assert.rejects(new News({ ...base(), tags: Array.from({ length: 21 }, oid) }).validate(), /at most 20 tags/);
    await assert.rejects(new News({ ...base(), tags: ['bjp'] }).validate(), /Cast to|tags/);          // free text is no longer accepted
    assert.equal(News.schema.paths.tags.caster.instance, 'ObjectId');
});

test('duplicates and over-limit selections are rejected', async () => {
    const c = oid();
    await assert.rejects(new News({ ...base(), category: [c, c] }).validate(), /duplicates/);
    await assert.rejects(new News({ ...base(), category: Array.from({ length: 11 }, oid) }).validate(), /at most 10 categories/);
});

test('free-text state / district can no longer be stored', async () => {
    const n = new News({ ...base(), draft: true, state: ['uttar pradesh'] });
    await assert.rejects(n.validate(), /Cast to \[ObjectId\]|state/);
});

test('old category rule does not block unrelated saves of existing published news', async () => {
    // simulate a loaded legacy doc: not new, no category, only a counter changes
    const doc = News.hydrate({ ...base(), _id: oid(), draft: false, isPublished: true, category: [] });
    doc.activity.total_reads = 5;
    await doc.validate();
});

test('Role schema: strict name, "*" only for the built-in admin, unknown keys rejected', async () => {
    await assert.rejects(new Role({ name: 'Bad Name!', permissions: ['news.create'] }).validate(), /Role name must be/);
    await assert.rejects(new Role({ name: 'editor', permissions: ['*'] }).validate(), /Unknown or forbidden/);
    await assert.rejects(new Role({ name: 'editor', permissions: ['news.fly'] }).validate(), /Unknown or forbidden/);
    await new Role({ name: 'desk-editor', permissions: ['news.create', 'news.*'] }).validate();
    await new Role({ name: 'admin', isSystem: true, permissions: ['*'] }).validate();
});

test('parseRange: IST day boundaries, previous period, limits', () => {
    const r = parseRange({ from: '2026-09-01', to: '2026-09-30' });
    assert.equal(r.days, 30);
    assert.equal(r.fromDay, '2026-09-01'); assert.equal(r.toDay, '2026-09-30');
    assert.equal(r.start.toISOString(), '2026-08-31T18:30:00.000Z');         // 00:00 IST
    assert.ok(r.prevEnd < r.start && r.prevStart < r.prevEnd);
    assert.throws(() => parseRange({ from: '2026-09-30', to: '2026-09-01' }), /before/);
    assert.throws(() => parseRange({ from: '2024-01-01', to: '2026-09-01' }), /cannot exceed/);
    assert.throws(() => parseRange({ from: '01-09-2026' }), /YYYY-MM-DD/);
});
