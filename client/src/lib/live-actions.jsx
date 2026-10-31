"use server";

import LiveStory from "@/components/live/LiveStory";
import { getNextLive } from "@/lib/data";

/**
 * Called by <LiveFeed> while the reader scrolls: renders the live story that comes after `afterSlug`
 * (on the server, so the editor body is sanitised there) and sends it back as ready-made UI.
 * -> { items: [{ slug, node }], hasMore }
 */
export async function loadNextLive(afterSlug) {
  if (typeof afterSlug !== "string" || !afterSlug || afterSlug.length > 200) return { items: [], hasMore: false };
  const { items, hasMore } = await getNextLive(afterSlug, { limit: 1 });
  return { items: items.map((live) => ({ slug: live.slug, node: <LiveStory live={live} /> })), hasMore };
}
