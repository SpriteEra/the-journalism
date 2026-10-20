import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Tag, { cleanTagTitle, tagKey } from '../model/tag.model.js';
import { parseTagInput, resolveNewsTags } from '../utils/newsTags.js';

const oid = () => new mongoose.Types.ObjectId();
const S = String;

test('tagKey / cleanTagTitle normalise spaces, case and "#"', () => {
    assert.equal(cleanTagTitle('  #Narendra   Modi '), 'Narendra Modi');
    assert.equal(tagKey('  #Narendra   MODI '), 'narendra modi');
    assert.equal(tagKey('भाजपा'), 'भाजपा');
});

test('Tag schema: required title, auto titleKey, alias clean-up, limits, language enum', async () => {
    await assert.rejects(new Tag({ slug: 'x' }).validate(), /Tag title is required/);
    await assert.rejects(new Tag({ title: 'a', slug: 'a' }).validate(), /at least 2 characters/);
    await assert.rejects(new Tag({ title: 'x'.repeat(81), slug: 'x' }).validate(), /cannot exceed 80/);
    await assert.rejects(new Tag({ title: 'Ok title', slug: 'ok', language: 'fr' }).validate(), /language must be/);
    await assert.rejects(new Tag({ title: 'Ok title', slug: 'ok', aliases: Array.from({ length: 16 }, (_, i) => `alias ${i}`) }).validate(), /at most 15 aliases/);
    const t = new Tag({ title: '  #BJP   News ', slug: 'bjp-news', aliases: ['BJP news', 'bjp', 'BJP', 'भाजपा', ''] });
    await t.validate();
    assert.equal(t.title, 'BJP News'); assert.equal(t.titleKey, 'bjp news');
    assert.deepEqual([...t.aliases], ['bjp', 'भाजपा']);          // title duplicate, repeats and empties removed
    assert.equal(t.isActive, true); assert.equal(t.isFeatured, false); assert.equal(t.isDeleted, false);
});

test('parseTagInput accepts every shape the form may send', () => {
    const a = S(oid()); const b = S(oid());
    assert.deepEqual(parseTagInput(undefined), []);
    assert.deepEqual(parseTagInput('null'), []);
    assert.deepEqual(parseTagInput(`${a},Modi`), [{ id: a }, { text: 'Modi' }]);
    assert.deepEqual(parseTagInput(JSON.stringify(['Modi', 'modi', ` #Modi `, a, a])), [{ text: 'Modi' }, { id: a }]);   // de-dupe by id / key
    assert.deepEqual(parseTagInput([{ _id: b, title: 'x' }, { title: 'Yogi' }, { slug: 'up-news' }]), [{ id: b }, { text: 'Yogi' }, { text: 'up-news' }]);
    assert.deepEqual(parseTagInput('[]'), []);
    assert.throws(() => parseTagInput('[oops'), /valid JSON array/);
    assert.throws(() => parseTagInput(['a']), /too short/);
    assert.throws(() => parseTagInput(['x'.repeat(81)]), /cannot exceed 80/);
});

// ── resolveNewsTags with stubbed collection ──
const live = (o) => ({ _id: oid(), isActive: true, isDeleted: false, aliases: [], mergedInto: null, ...o });
const modi = live({ title: 'Modi', slug: 'modi', titleKey: 'modi', aliases: ['narendra modi'] });
const bjp = live({ title: 'BJP', slug: 'bjp', titleKey: 'bjp' });
const old = live({ title: 'Old', slug: 'old', titleKey: 'old', isActive: false });
const gone = live({ title: 'Gone', slug: 'gone', titleKey: 'gone', isDeleted: true });
const merged = live({ title: 'Mod i', slug: 'mod-i', titleKey: 'mod i', isDeleted: true, isActive: false, mergedInto: modi._id });
const db = [modi, bjp, old, gone, merged];
const chain = (rows) => ({ select() { return this; }, lean: async () => rows, then(r, j) { return Promise.resolve(rows).then(r, j); } });
let created = [];
Tag.find = (q) => {
    const ors = q.$or || [];
    const hit = db.filter((d) => ors.some((c) => (c._id && c._id.$in?.some((i) => S(i) === S(d._id))) || (c.slug && c.slug.$in?.includes(d.slug))
        || (c.titleKey && c.titleKey.$in?.includes(d.titleKey) && !d.isDeleted) || (c.aliases && c.aliases.$in?.some((k) => d.aliases.includes(k)) && !d.isDeleted)));
    if (q._id?.$in) return chain(db.filter((d) => q._id.$in.some((i) => S(i) === S(d._id))));
    return chain(hit);
};
Tag.exists = async () => null;
Tag.create = async (doc) => { const d = { _id: oid(), isActive: true, aliases: [], ...doc, toObject() { return this; } }; created.push(d); db.push(d); return d; };

test('resolveNewsTags: ids, titles, aliases, slugs → existing tags in the given order, no duplicates', async () => {
    const r = await resolveNewsTags([S(bjp._id), 'MODI', 'Narendra Modi', 'bjp'], { canCreate: false });
    assert.deepEqual(r.ids, [S(bjp._id), S(modi._id)]);
    assert.equal(r.created.length, 0);
});

test('resolveNewsTags: unknown titles are created only with tag.create, otherwise 400', async () => {
    await assert.rejects(resolveNewsTags(['Brand New'], { canCreate: false }), /does not exist and you are not allowed/);
    created = [];
    const r = await resolveNewsTags(['Modi', 'Brand New'], { canCreate: true, userId: oid() });
    assert.equal(r.ids.length, 2); assert.equal(created.length, 1);
    assert.equal(created[0].title, 'Brand New'); assert.equal(created[0].slug, 'brand-new'); assert.equal(created[0].source, 'news-form');
});

test('resolveNewsTags: bad / deleted ids, inactive tags, merged tags, limits, required', async () => {
    await assert.rejects(resolveNewsTags([S(oid())]), /Tag not found/);
    await assert.rejects(resolveNewsTags([S(gone._id)]), /Tag not found/);
    await assert.rejects(resolveNewsTags([S(old._id)]), /inactive/);
    assert.deepEqual((await resolveNewsTags([S(old._id)], { existing: [old._id] })).ids, [S(old._id)]);     // already on the news -> allowed
    assert.deepEqual((await resolveNewsTags([S(merged._id), S(modi._id)])).ids, [S(modi._id)]);             // merged tag -> its target, de-duped
    await assert.rejects(resolveNewsTags(Array.from({ length: 21 }, (_, i) => `tag number ${i}`), { canCreate: true }), /at most 20/);
    await assert.rejects(resolveNewsTags([], { requireTag: true }), /At least one tag is required/);
    assert.deepEqual((await resolveNewsTags(undefined)).ids, []);                                              // drafts may have none
});
