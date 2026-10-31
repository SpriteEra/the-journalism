"use server";
/**
 * Server Actions for the infinite scrolls. A client component calls these like normal async functions; they run on the server and
 * hand back ALREADY RENDERED markup (a server component), so the browser never downloads sanitize-html or the API address.
 *
 *   loadOlderArticle(lastId)          -> { item:{ id, path, title, node } | null, hasMore }   the story published right before `lastId`
 *   loadOlderUpdates(slug, before)    -> { node, hasMore, nextCursor }                        older entries of a live blog
 *   loadNewUpdates(slug, after)       -> { count, node, latestCursor, status }                entries added since `after`
 */
import ArticleBody from "@/components/article/ArticleBody";
import LiveUpdates from "@/components/live/LiveUpdates";
import { getLiveUpdates, getOlderArticle } from "@/lib/data";

// Actions are public endpoints: never trust the arguments
const clean = (v) => String(v ?? "").trim().slice(0, 200);

export async function loadOlderArticle(lastId) {
  const id = clean(lastId);
  if (!id) return { item: null, hasMore: false };
  const data = await getOlderArticle(id);                  // throws when the API is down (the client shows "try again"); null = nothing older
  if (!data) return { item: null, hasMore: false };
  const { article, seo } = data;
  return {
    item: { id: article.news_id, path: data.canonicalPath || "", title: seo?.meta?.title || article.title, node: <ArticleBody data={data} /> },
    hasMore: data.hasMore,
  };
}

export async function loadOlderUpdates(slug, before) {
  const s = clean(slug), b = clean(before);
  if (!s || !b) return { node: null, hasMore: false, nextCursor: null };
  const r = await getLiveUpdates(s, { before: b });
  if (!r) throw new Error("live updates are not available right now");
  return { node: r.updates.length ? <LiveUpdates updates={r.updates} /> : null, hasMore: r.hasMore, nextCursor: r.nextCursor };
}

export async function loadNewUpdates(slug, after) {
  const s = clean(slug), a = clean(after);
  if (!s || !a) return { count: 0, node: null, latestCursor: null, status: null };
  const r = await getLiveUpdates(s, { after: a });
  if (!r) return { count: 0, node: null, latestCursor: null, status: null };   // a missed poll is not an error: the next one tries again
  return { count: r.updates.length, node: r.updates.length ? <LiveUpdates updates={r.updates} /> : null, latestCursor: r.latestCursor, status: r.status };
}
