/**
 * One-time migration:  YtShort ("ytshorts") + CustomVideo ("customvideos")  ->  ShortVideo ("shortvideos")
 *
 *   ytshorts      source 'youtube_auto' | 'manual'   ->  sourceType 'youtube_auto' | 'youtube_manual', kind 'short'
 *   customvideos  (our own uploaded files)           ->  sourceType 'upload', kind kept, post_time -> publishedAt
 *   category (single) -> category [ ]      state / district (lowercase names) -> [ObjectId] from the State / District collections
 *   tags (strings)    -> keywords [ ]      (YouTube / typed keywords are NOT turned into Tag documents automatically;
 *                                           editors attach real tags later. Add --tags-to-tags to create Tag documents instead.)
 *
 * _id values are kept, so UpdateStack.relatedId and any links stay valid. Slug clashes between the two old collections get "-2".
 * Safe to re-run (documents already copied are skipped). The old collections are NOT touched unless you pass --drop-old.
 *
 *   node scripts/migrate-videos-to-short-video.js                     dry run – prints what WOULD happen
 *   node scripts/migrate-videos-to-short-video.js --apply
 *   node scripts/migrate-videos-to-short-video.js --apply --drop-old   (after you have checked the result; irreversible)
 *
 * TAKE A BACKUP FIRST (mongodump).
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ShortVideo from '../model/short-video.model.js';
import State from '../model/state.model.js';
import District from '../model/district.model.js';
import UpdateStack from '../model/updatedstack.model.js';
import Tag, { cleanTagTitle, tagKey } from '../model/tag.model.js';
import { makeSlug, uniqueSlug } from '../utils/slug.js';

dotenv.config();
const APPLY = process.argv.includes('--apply');
const DROP = process.argv.includes('--drop-old');
const TAGS = process.argv.includes('--tags-to-tags');
const norm = (s) => String(s ?? '').trim().toLowerCase();
const oidList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const report = { ytshorts: { seen: 0, copied: 0, skipped: 0 }, customvideos: { seen: 0, copied: 0, skipped: 0 }, missingState: new Map(), missingDistrict: new Map(), slugRenamed: 0, tagsCreated: 0 };
const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);

const run = async () => {
    await mongoose.connect(process.env.MONGO_URL);
    const db = mongoose.connection.db;
    console.log(`\n${APPLY ? 'APPLY' : 'DRY RUN'} — database: ${mongoose.connection.name}\n`);

    const [states, districts] = await Promise.all([State.find().lean(), District.find().lean()]);
    const stateMap = new Map(); const districtMap = new Map();
    states.forEach((s) => { stateMap.set(norm(s.state), s._id); if (s.slug) stateMap.set(norm(s.slug), s._id); });
    districts.forEach((d) => { districtMap.set(norm(d.district), d); if (d.slug) districtMap.set(norm(d.slug), d); });
    const tagMap = new Map();
    if (TAGS) (await Tag.find({ isDeleted: false }).select('titleKey slug aliases').lean()).forEach((t) => { tagMap.set(t.titleKey, t._id); (t.aliases || []).forEach((a) => tagMap.set(a, t._id)); });

    const takenSlugs = new Set((await ShortVideo.find().select('slug').lean()).map((d) => d.slug));
    const alreadyThere = new Set((await ShortVideo.find().select('_id').lean()).map((d) => String(d._id)));
    const freeSlug = async (slug) => {
        let s = slug; let n = 2;
        while (takenSlugs.has(s)) { s = `${slug}-${n++}`; report.slugRenamed++; }
        takenSlugs.add(s); return s;
    };

    const taxonomy = async (doc) => {
        const stateIds = []; const districtIds = [];
        for (const v of oidList(doc.state)) {
            const id = stateMap.get(norm(v));
            if (!id) bump(report.missingState, norm(v)); else if (!stateIds.some((x) => String(x) === String(id))) stateIds.push(id);
        }
        for (const v of oidList(doc.district)) {
            const d = districtMap.get(norm(v));
            if (!d) { bump(report.missingDistrict, norm(v)); continue; }
            if (!districtIds.some((x) => String(x) === String(d._id))) districtIds.push(d._id);
            if (d.state && !stateIds.some((x) => String(x) === String(d.state))) stateIds.push(d.state);      // keep "district belongs to a selected state"
        }
        const words = [...new Set(oidList(doc.tags).map((t) => cleanTagTitle(t)).filter((t) => t.length >= 2))];
        let tagIds = [];
        if (TAGS) {
            for (const w of words.slice(0, 20)) {
                const key = tagKey(w);
                if (!tagMap.has(key)) {
                    if (!APPLY) { tagMap.set(key, new mongoose.Types.ObjectId()); report.tagsCreated++; }
                    else {
                        const base = (/^[\x20-\x7E]+$/.test(w) && key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) || await makeSlug(w);
                        const t = await Tag.create({ title: w.slice(0, 80), slug: await uniqueSlug(Tag, base), source: 'migration' });
                        tagMap.set(key, t._id); report.tagsCreated++;
                    }
                }
                tagIds.push(tagMap.get(key));
            }
        }
        return { state: stateIds, district: districtIds, category: oidList(doc.category), tags: tagIds, keywords: TAGS ? [] : words.slice(0, 40) };
    };

    const copy = async (name, mapDoc) => {
        const exists = (await db.listCollections({ name }).toArray()).length > 0;
        if (!exists) { console.log(`── ${name}: collection not found, skipped`); return; }
        console.log(`── ${name}`);
        let batch = [];
        const flush = async () => { if (APPLY && batch.length) await ShortVideo.collection.insertMany(batch, { ordered: false }); batch = []; };
        for await (const old of db.collection(name).find({})) {
            report[name].seen++;
            if (alreadyThere.has(String(old._id))) { report[name].skipped++; continue; }
            const base = await mapDoc(old);
            const now = new Date();
            batch.push({
                ...base, _id: old._id, slug: await freeSlug(norm(old.slug)), subCategory: [],
                activity: { total_reads: old.activity?.total_reads || 0, total_today_count: old.activity?.total_today_count || 0 },
                seo: old.seo || {}, author: old.author, update_stack: old.update_stack, isDeleted: Boolean(old.isDeleted),
                createdAt: old.createdAt || now, updatedAt: old.updatedAt || now, __v: 0,
            });
            report[name].copied++;
            if (batch.length >= 300) await flush();
        }
        await flush();
    };

    await copy('ytshorts', async (o) => ({
        ...(await taxonomy(o)),
        title: o.title, description: o.description || '', kind: 'short', sourceType: o.source === 'manual' ? 'youtube_manual' : 'youtube_auto',
        videoLinkId: o.videoLinkId, channelId: o.channelId || '', channelTitle: o.channelTitle || '', thumbnail: o.thumbnail || '', duration: o.duration || 0,
        draft: Boolean(o.draft), isPublished: !o.draft, publishedAt: o.publishedAt || o.createdAt,
    }));
    await copy('customvideos', async (o) => ({
        ...(await taxonomy(o)),
        title: o.title, description: o.description || '', kind: o.kind === 'video' ? 'video' : 'short', sourceType: 'upload',
        videoUrl: o.videoUrl, storageProvider: process.env.VIDEO_STORAGE_PROVIDER || 'media-server', mimeType: o.mimeType || '', size: o.size || 0,
        width: o.width || 0, height: o.height || 0, thumbnail: o.thumbnail || '', duration: o.duration || 0,
        draft: Boolean(o.draft), isPublished: Boolean(o.isPublished), publishedAt: o.post_time || undefined,
    }));

    if (APPLY) {
        const r = await UpdateStack.collection.updateMany({ type: { $in: ['YtShort', 'CustomVideo'] } }, { $set: { type: 'ShortVideo' } });
        console.log(`\nupdate stacks re-labelled: ${r.modifiedCount}`);
        await ShortVideo.syncIndexes().catch((e) => console.warn('syncIndexes:', e.message));
    }

    const fmt = (m) => (m.size ? [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `    ${k}  (${n})`).join('\n') : '    none');
    console.log(`\nytshorts:     seen ${report.ytshorts.seen}, ${APPLY ? 'copied' : 'would copy'} ${report.ytshorts.copied}, already migrated ${report.ytshorts.skipped}`);
    console.log(`customvideos: seen ${report.customvideos.seen}, ${APPLY ? 'copied' : 'would copy'} ${report.customvideos.copied}, already migrated ${report.customvideos.skipped}`);
    console.log(`slugs renamed after a clash: ${report.slugRenamed}`);
    if (TAGS) console.log(`tags ${APPLY ? 'created' : 'would be created'}: ${report.tagsCreated}`);
    console.log(`\nStates not found in the State collection (dropped):\n${fmt(report.missingState)}`);
    console.log(`\nDistricts not found in the District collection (dropped):\n${fmt(report.missingDistrict)}`);

    if (DROP) {
        if (!APPLY) console.log('\n--drop-old is ignored in a dry run');
        else for (const name of ['ytshorts', 'customvideos']) { await db.collection(name).drop().catch(() => { }); console.log(`dropped ${name}`); }
    } else if (APPLY) console.log('\nOld collections were kept. After checking the app, run again with --apply --drop-old to remove them.');
    if (!APPLY) console.log('\nDry run only — nothing was written. Add --apply to write.');
    await mongoose.disconnect();
};

run().catch(async (e) => { console.error(e); await mongoose.disconnect().catch(() => { }); process.exit(1); });
