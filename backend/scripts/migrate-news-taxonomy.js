/**
 * One-time data migration for the new news schema.
 *
 *   BEFORE                                   AFTER
 *   state:            ["uttar pradesh"]      state:       [ObjectId(State)]
 *   district:         ["varanasi"]           district:    [ObjectId(District)]
 *   news_section_type ["crime","politics"]   category:    [ObjectId(Category)]   (section is removed)
 *   tags:             ["bjp","modi"]         tags:        [ObjectId(Tag)]        (a Tag document is created per distinct tag)
 *   category:         ObjectId               category:    [ObjectId]             (single -> array)
 *   subCategory:      ObjectId               subCategory: [ObjectId]             (single -> array, may be empty)
 *
 * Usage (from the project root, with MONGO_URL in .env):
 *   node scripts/migrate-news-taxonomy.js                    dry run – prints what WOULD happen, writes nothing
 *   node scripts/migrate-news-taxonomy.js --apply            writes the changes
 *   node scripts/migrate-news-taxonomy.js --apply --create-missing
 *                                                            also creates the State / District / Category documents
 *                                                            that old news used as free text but do not exist yet
 *   add --collections=news,schedulenews to limit what is migrated (default: both)
 *
 * Safe to re-run: documents that are already converted are skipped. TAKE A BACKUP FIRST (mongodump).
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Category from '../model/category.model.js';
import State from '../model/state.model.js';
import District from '../model/district.model.js';
import Tag, { cleanTagTitle, tagKey } from '../model/tag.model.js';
import { makeSlug, uniqueSlug } from '../utils/slug.js';
import News from '../model/news.models.js';
import ScheduleNews from '../model/scheduleNews.model.js';

dotenv.config();
const APPLY = process.argv.includes('--apply');
const CREATE = process.argv.includes('--create-missing');
const only = (process.argv.find((a) => a.startsWith('--collections=')) || '').split('=')[1];
const targets = [['news', News], ['schedulenews', ScheduleNews]].filter(([n]) => !only || only.split(',').includes(n));

const isOid = (v) => v instanceof mongoose.Types.ObjectId || (typeof v === 'object' && v?._bsontype === 'ObjectId') || (typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v));
const norm = (s) => String(s ?? '').trim().toLowerCase();
const slugify = (s) => norm(s).replace(/[^a-z0-9\u0900-\u097f]+/g, '-').replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
const asArray = (v) => (v === undefined || v === null || v === '' ? [] : Array.isArray(v) ? v : [v]);

const report = { tagsCreated: 0, tagsDropped: 0, scanned: 0, converted: 0, alreadyDone: 0, noCategoryAfter: 0, missing: { state: new Map(), district: new Map(), category: new Map() } };
const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);

const run = async () => {
    await mongoose.connect(process.env.MONGO_URL);
    console.log(`\n${APPLY ? 'APPLY' : 'DRY RUN'} ${CREATE ? '(+create-missing)' : ''} — database: ${mongoose.connection.name}\n`);

    const [states, districts, cats] = await Promise.all([State.find().lean(), District.find().lean(), Category.find({ isDeleted: false }).lean()]);
    const stateMap = new Map(); const districtMap = new Map(); const catMap = new Map();
    states.forEach((s) => { stateMap.set(norm(s.state), s._id); if (s.slug) stateMap.set(norm(s.slug), s._id); if (s.displayName) stateMap.set(norm(s.displayName), s._id); });
    districts.forEach((d) => { districtMap.set(norm(d.district), d); if (d.slug) districtMap.set(norm(d.slug), d); if (d.displayName) districtMap.set(norm(d.displayName), d); });
    cats.forEach((c) => { catMap.set(norm(c.slug), c); catMap.set(norm(c.name), c); });
    const catById = new Map(cats.map((c) => [String(c._id), c]));

    // tags: old news hold plain strings. Every distinct string becomes (or reuses) a Tag document.
    const tagMap = new Map();                     // titleKey / alias / slug -> _id
    (await Tag.find({ isDeleted: false }).select('titleKey aliases slug').lean()).forEach((t) => {
        tagMap.set(t.titleKey, t._id); tagMap.set(t.slug, t._id); (t.aliases || []).forEach((a) => tagMap.set(a, t._id));
    });
    const ensureTag = async (raw) => {
        const title = cleanTagTitle(raw);
        if (title.length < 2) { report.tagsDropped++; return null; }
        const key = tagKey(title).slice(0, 80);
        if (tagMap.has(key)) return tagMap.get(key);
        if (!(APPLY)) { tagMap.set(key, new mongoose.Types.ObjectId()); report.tagsCreated++; return tagMap.get(key); }   // dry run: count only
        const base = (/^[\x20-\x7E]+$/.test(title) && key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) || await makeSlug(title);
        const doc = await Tag.create({ title: title.slice(0, 80), slug: await uniqueSlug(Tag, base), source: 'migration' });
        tagMap.set(key, doc._id); report.tagsCreated++; return doc._id;
    };

    const ensure = async (kind, key, context) => {
        if (kind === 'state') {
            if (stateMap.has(key)) return stateMap.get(key);
            bump(report.missing.state, key);
            if (!(APPLY && CREATE)) return null;
            const doc = await State.create({ state: key, slug: slugify(key) });
            stateMap.set(key, doc._id); return doc._id;
        }
        if (kind === 'district') {
            if (districtMap.has(key)) return districtMap.get(key)._id;
            bump(report.missing.district, key);
            if (!(APPLY && CREATE)) return null;
            const doc = await District.create({ district: key, slug: slugify(key), ...(context.stateId ? { state: context.stateId } : {}) });
            if (context.stateId) await State.updateOne({ _id: context.stateId }, { $addToSet: { districts: doc._id } });
            districtMap.set(key, doc); return doc._id;
        }
        // category (from an old news_section_type value)
        if (catMap.has(key)) return catMap.get(key)._id;
        bump(report.missing.category, key);
        if (!(APPLY && CREATE)) return null;
        const doc = await Category.create({ name: key, slug: slugify(key), parent: null });
        catMap.set(key, doc); catById.set(String(doc._id), doc); return doc._id;
    };

    for (const [name, Model] of targets) {
        const col = Model.collection;
        console.log(`── ${name}`);
        const cursor = col.find({});
        let ops = [];
        const flush = async () => { if (APPLY && ops.length) await col.bulkWrite(ops, { ordered: false }); ops = []; };

        for await (const doc of cursor) {
            report.scanned++;
            const stateVals = asArray(doc.state); const distVals = asArray(doc.district);
            const catVals = asArray(doc.category); const subVals = asArray(doc.subCategory);
            const sections = asArray(doc.news_section_type);
            const tagVals = asArray(doc.tags);
            const done = tagVals.every(isOid) && stateVals.every(isOid) && distVals.every(isOid) && catVals.every(isOid) && subVals.every(isOid)
                && !('news_section_type' in doc) && Array.isArray(doc.category) && Array.isArray(doc.subCategory);
            if (done) { report.alreadyDone++; continue; }

            // states
            const stateIds = [];
            for (const v of stateVals) {
                const id = isOid(v) ? new mongoose.Types.ObjectId(String(v)) : await ensure('state', norm(v), {});
                if (id && !stateIds.some((x) => String(x) === String(id))) stateIds.push(id);
            }
            // districts (a new district is attached to the doc's state when that is unambiguous)
            const districtIds = [];
            for (const v of distVals) {
                const id = isOid(v) ? new mongoose.Types.ObjectId(String(v)) : await ensure('district', norm(v), { stateId: stateIds.length === 1 ? stateIds[0] : null });
                if (id && !districtIds.some((x) => String(x) === String(id))) districtIds.push(id);
                // keep "district belongs to one of the selected states" true
                const d = [...districtMap.values()].find((x) => String(x._id) === String(id));
                if (d?.state && !stateIds.some((x) => String(x) === String(d.state))) stateIds.push(d.state);
            }
            // categories: old single category + old sections
            const catIds = [];
            const pushCat = (id) => { if (id && !catIds.some((x) => String(x) === String(id))) catIds.push(id); };
            catVals.filter(isOid).forEach((v) => pushCat(new mongoose.Types.ObjectId(String(v))));
            for (const sec of sections) pushCat(await ensure('category', norm(sec), {}));
            // sub-categories: keep, and make sure each parent is a selected category
            const subIds = [];
            for (const v of subVals.filter(isOid)) {
                const id = new mongoose.Types.ObjectId(String(v));
                subIds.push(id);
                const parent = catById.get(String(id))?.parent;
                if (parent) pushCat(parent);
            }
            // a "category" that is really a sub-category (parent set) belongs in subCategory
            for (let i = catIds.length - 1; i >= 0; i--) {
                const c = catById.get(String(catIds[i]));
                if (c?.parent) { const [sub] = catIds.splice(i, 1); if (!subIds.some((x) => String(x) === String(sub))) subIds.push(sub); pushCat(c.parent); }
            }

            // tags: strings -> Tag ids (an already converted id is kept)
            const tagIds = [];
            for (const v of tagVals) {
                const id = isOid(v) ? new mongoose.Types.ObjectId(String(v)) : await ensureTag(v);
                if (id && !tagIds.some((x) => String(x) === String(id))) tagIds.push(id);
            }
            if (tagIds.length > 20) { tagIds.length = 20; }

            const published = doc.isPublished && !doc.draft && !doc.isDeleted;
            if (published && catIds.length === 0) report.noCategoryAfter++;
            report.converted++;
            ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { state: stateIds, district: districtIds, category: catIds, subCategory: subIds, tags: tagIds }, $unset: { news_section_type: '' } } } });
            if (ops.length >= 500) await flush();
        }
        await flush();
    }

    const fmt = (m) => (m.size ? [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `    ${k}  (${n} news)`).join('\n') : '    none');
    console.log(`\nscanned ${report.scanned}, ${APPLY ? 'converted' : 'would convert'} ${report.converted}, already converted ${report.alreadyDone}`);
    console.log(`\nStates used by old news but missing in the State collection:\n${fmt(report.missing.state)}`);
    console.log(`\nDistricts used by old news but missing in the District collection:\n${fmt(report.missing.district)}`);
    console.log(`\nOld sections with no matching Category (by slug or name):\n${fmt(report.missing.category)}`);
    console.log(`\nTags: ${report.tagsCreated} ${APPLY ? 'created' : 'would be created'} from old string tags (${report.tagsDropped} too-short values dropped)`);
    console.log(`\nPublished news that will have NO category after migration: ${report.noCategoryAfter}`);
    if (!CREATE && (report.missing.state.size || report.missing.district.size || report.missing.category.size)) console.log('\nRe-run with --create-missing to create those documents, or create/rename them in the admin panel first.');
    if (!APPLY) console.log('\nDry run only — nothing was written. Add --apply to write.');
    else await Promise.all([News.syncIndexes().catch(() => { }), ScheduleNews.syncIndexes().catch(() => { }), Tag.syncIndexes().catch(() => { })]);
    await mongoose.disconnect();
};

run().catch(async (e) => { console.error(e); await mongoose.disconnect().catch(() => { }); process.exit(1); });
