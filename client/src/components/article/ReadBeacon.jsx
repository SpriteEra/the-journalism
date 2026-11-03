"use client";
import { useEffect } from "react";

/**
 * Counts ONE read for a real visitor, for any content type:
 *   <ReadBeacon id={news.news_id} />            news (default)
 *   <ReadBeacon type="short" id={v.slug} />     short / custom video (ShortVideo)
 *   <ReadBeacon type="yt" id={v.id} />          legacy YtNews video (news_id)
 * It runs in the browser and posts to our own /api/view/<type>/<id> route, so bots and page rebuilds do not count.
 * Once per tab per item, and only after the visitor stayed 3 seconds.
 */
export default function ReadBeacon({ type = "news", id }) {
  useEffect(() => {
    if (!id) return;
    const key = `read:${type}:${id}`;
    try { if (sessionStorage.getItem(key)) return; } catch { }
    const t = setTimeout(() => {
      try { sessionStorage.setItem(key, "1"); } catch { }
      fetch(`/api/view/${encodeURIComponent(id)}?type=${encodeURIComponent(type)}`, { method: "POST", keepalive: true }).catch(() => { });
    }, 3000); // a visit shorter than 3 s is not a read
    return () => clearTimeout(t);
  }, [type, id]);
  return null;
}