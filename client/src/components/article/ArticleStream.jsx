"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadOlderArticle } from "@/lib/actions";
import ReadBeacon from "@/components/article/ReadBeacon";

/**
 * Infinite scroll for the story page.
 *
 *  - `children` is the FIRST story, already rendered on the server (it is in the page's HTML).
 *  - Near the bottom, the story published right BEFORE the last one on screen is fetched (Server Action -> /news/get/:id/older)
 *    and appended. Each call moves one story further back in time, so nothing is repeated.
 *  - While reading, the address bar and the tab title follow the story that is crossing the middle of the screen,
 *    and that story's read is counted (once).
 *
 *   first = { id, path }
 */
export default function ArticleStream({ first, children }) {
  const [items, setItems] = useState([]);          // appended stories: { id, path, title, node }
  const [status, setStatus] = useState("idle");    // idle | loading | error | done
  const [read, setRead] = useState([]);            // ids of appended stories the reader has actually reached

  const root = useRef(null);
  const sentinel = useRef(null);
  const lastId = useRef(first.id);
  const busy = useRef(false);
  const baseTitle = useRef("");

  const loadMore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setStatus("loading");
    try {
      const { item, hasMore } = await loadOlderArticle(lastId.current);
      if (!item) { setStatus("done"); return; }
      lastId.current = item.id;
      setItems((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item]));
      setStatus(hasMore ? "idle" : "done");
    } catch {
      setStatus("error");                          // no automatic retry loop: the reader taps "try again"
    } finally {
      busy.current = false;
    }
  }, []);

  // load the next story when the bottom is within ~1.5 screens. Re-created after every load, so if the new story is short and the
  // sentinel is still on screen, the observer reports it again and the next story follows.
  useEffect(() => {
    if (status !== "idle") return;
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) loadMore(); }, { rootMargin: "0px 0px 1200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [status, items.length, loadMore]);

  // which story is being read: the one crossing a thin line at ~45% of the screen height
  useEffect(() => { baseTitle.current = document.title; }, []);
  useEffect(() => {
    const els = root.current?.querySelectorAll("[data-story]");
    if (!els?.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const { storyId, path, title, isFirst } = e.target.dataset;
        if (path && window.location.pathname !== path) window.history.replaceState(window.history.state, "", path);
        document.title = isFirst ? baseTitle.current || document.title : title || document.title;
        if (!isFirst) setRead((prev) => (prev.includes(storyId) ? prev : [...prev, storyId]));
      });
    }, { rootMargin: "-45% 0px -54% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items.length]);

  return (
    <>
      <div ref={root}>
        <div data-story="" data-story-id={first.id} data-path={first.path} data-is-first="1">{children}</div>

        {items.map((it) => (
          <div key={it.id} data-story="" data-story-id={it.id} data-path={it.path} data-title={it.title} className="mt-10 border-t-4 border-primary/20 pt-8">
            {it.node}
          </div>
        ))}

        <div ref={sentinel} aria-hidden className="h-px" />

        {status === "loading" && (
          <div className="mt-8 space-y-3" role="status" aria-label="अगली खबर लोड हो रही है">
            <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="aspect-video w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 text-center">
            <p className="text-black/70">अगली खबर लोड नहीं हो सकी।</p>
            <button type="button" onClick={loadMore} className="mt-2 inline-flex h-10 items-center rounded-sm border border-primary px-5 font-medium text-primary hover:bg-primary hover:text-white">दोबारा कोशिश करें</button>
          </div>
        )}
      </div>

      {/* a story's read is counted when the reader reaches it, not when it is merely loaded */}
      {read.map((id) => <ReadBeacon key={id} id={id} />)}
    </>
  );
}
