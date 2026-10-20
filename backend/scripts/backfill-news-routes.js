/**
 * Gives every existing story its URL parts:  slug  +  primaryRoute (first category, else first state).
 *   node scripts/backfill-news-routes.js            dry run (prints what would change)
 *   node scripts/backfill-news-routes.js --apply    writes it
 * Safe to run again: stories that already have both are skipped, and a slug, once set, is never rewritten.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import News from '../model/news.models.js';
import { makeNewsSlug, pickPrimary } from '../utils/newsRoute.js';

const APPLY = process.argv.includes('--apply');

await mongoose.connect(process.env.MONGO_URL);
console.log(`\n${APPLY ? 'APPLY' : 'DRY RUN'} — database: ${mongoose.connection.name}\n`);

const cursor = News.find({ isDeleted: false, $or: [{ slug: { $exists: false } }, { slug: null }, { 'primaryRoute.slug': { $exists: false } }] })
    .select('news_id title slug primaryRoute category state').lean().cursor();

let seen = 0; let changed = 0; let noRoute = 0;
for await (const n of cursor) {
    seen += 1;
    const $set = {};
    if (!n.slug) $set.slug = await makeNewsSlug(n.title);
    if (!n.primaryRoute?.slug) {
        const route = await pickPrimary({ categoryIds: n.category || [], stateIds: n.state || [] }).catch(() => null);
        if (route) $set.primaryRoute = route; else noRoute += 1;
    }
    if (!Object.keys($set).length) continue;
    changed += 1;
    if (changed <= 15) console.log(`${n.news_id}  ${$set.slug || n.slug}  ${$set.primaryRoute ? `/${$set.primaryRoute.slug}/news/…` : '(no category / state → keeps /news/:id)'}`);
    if (APPLY) await News.updateOne({ _id: n._id }, { $set });
}
console.log(`\nchecked ${seen}, ${APPLY ? 'updated' : 'would update'} ${changed}, ${noRoute} have no category or state (they keep the old /news/:id link).`);
if (!APPLY) console.log('Run again with --apply to write the changes.');
await mongoose.disconnect();
