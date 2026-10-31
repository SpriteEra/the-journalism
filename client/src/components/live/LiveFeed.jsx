"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadNextLive } from "@/lib/live-actions";

/**
 * Endless scroll for live stories. The page shows ONE live story; when the reader gets near the end of it,
 * the next live story is loaded and shown below it, then the next, and so on.
 * `afterSlug` = slug of the story already on the page.
 */
export default function LiveFeed({ afterSlug }) {
  const [stories, setStories] = useState([]);       // [{ slug, node }]
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const last = useRef(afterSlug);                    // slug of the last story shown
  const busy = useRef(false);                        // stops double loads while a request is running
  const sentinel = useRef(null);

  const more = useCallback(async () => {
    if (busy.current) return;
    busy.current = true; setLoading(true); setFailed(false);
    try {
      const r = await loadNextLive(last.current);
      if (r.items.length) {
        last.current = r.items[r.items.length - 1].slug;
        setStories((prev) => [...prev, ...r.items.filter((it) => !prev.some((p) => p.slug === it.slug))]);
      }
      setHasMore(r.hasMore && r.items.length > 0);
    } catch {
      setFailed(true);
    } finally {
      busy.current = false; setLoading(false);
    }
  }, []);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || failed) return;
    const io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) more(); }, { rootMargin: "600px 0px" }); // start a little before the end is reached
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, failed, more, stories.length]);

  return (
    <>
      {stories.map((s) => <div key={s.slug} className="mt-8">{s.node}</div>)}

      {hasMore && <div ref={sentinel} aria-hidden className="h-px" />}

      {loading && <p className="mt-6 text-center text-sm text-black/60" role="status">अगली लाइव ख़बर लोड हो रही है…</p>}
      {failed && (
        <div className="mt-6 text-center">
          <button type="button" onClick={more} className="rounded-full border border-black px-4 py-1.5 text-sm font-medium hover:bg-black/5">फिर कोशिश करें</button>
        </div>
      )}
      {!hasMore && stories.length > 0 && <p className="mt-8 text-center text-sm text-black/50">और कोई लाइव ख़बर नहीं है</p>}
    </>
  );
}
