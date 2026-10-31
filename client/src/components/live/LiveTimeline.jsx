"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadNewUpdates, loadOlderUpdates } from "@/lib/actions";

const POLL_MS = 20000;
const NO_ID = "0".repeat(24);

/**
 * The timeline of a live blog.
 *
 *  - `children` = the first page of entries, rendered on the server (pinned ones first, then the newest).
 *  - Scrolling down loads OLDER entries (Server Action -> /live/:slug/updates?before=<nextCursor>) — each call continues where the last one stopped.
 *  - While the coverage is live, the page asks every 20 s for entries newer than the newest it has. They are NOT pushed into the
 *    page under the reader's eyes: a "N नए अपडेट" button appears and shows them on tap. When the coverage ends, polling stops.
 */
export default function LiveTimeline({ slug, isLive, hasMore, nextCursor, latestCursor, children }) {
  const [older, setOlder] = useState([]);                    // [{ key, node }] appended at the bottom
  const [fresh, setFresh] = useState([]);                    // [{ key, node }] revealed new entries, newest on top
  const [pending, setPending] = useState({ count: 0, chunks: [] });
  const [status, setStatus] = useState(hasMore && nextCursor ? "idle" : "done");
  const [live, setLive] = useState(Boolean(isLive));
  const [ended, setEnded] = useState(false);

  const next = useRef(nextCursor);
  const latest = useRef(latestCursor || `${Date.now()}_${NO_ID}`);   // an empty timeline: "newer than now"
  const busy = useRef(false);
  const seq = useRef(0);
  const sentinel = useRef(null);
  const top = useRef(null);

  const loadMore = useCallback(async () => {
    if (busy.current || !next.current) return;
    busy.current = true;
    setStatus("loading");
    try {
      const r = await loadOlderUpdates(slug, next.current);
      if (r.node) setOlder((prev) => [...prev, { key: `o${seq.current++}`, node: r.node }]);
      next.current = r.nextCursor;
      setStatus(r.hasMore && r.nextCursor ? "idle" : "done");
    } catch {
      setStatus("error");
    } finally {
      busy.current = false;
    }
  }, [slug]);

  // older entries: load when the bottom is within ~1.5 screens (re-created after each load so a short page keeps filling)
  useEffect(() => {
    if (status !== "idle") return;
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) loadMore(); }, { rootMargin: "0px 0px 1200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [status, older.length, loadMore]);

  // new entries: poll while live (paused while the tab is hidden, checked right away when it comes back)
  useEffect(() => {
    if (!live) return;
    let polling = false;
    const poll = async () => {
      if (document.hidden || polling) return;
      polling = true;
      try {
        const r = await loadNewUpdates(slug, latest.current);
        if (r.count > 0 && r.node) {
          if (r.latestCursor) latest.current = r.latestCursor;
          setPending((p) => ({ count: p.count + r.count, chunks: [{ key: `n${seq.current++}`, node: r.node }, ...p.chunks] }));
        }
        if (r.status === "ended") { setLive(false); setEnded(true); }
      } catch { /* a missed poll is fine: the next one tries again */ }
      finally { polling = false; }
    };
    const timer = setInterval(poll, POLL_MS);
    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [live, slug]);

  const reveal = () => {
    setFresh((prev) => [...pending.chunks, ...prev]);
    setPending({ count: 0, chunks: [] });
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={top} className="scroll-mt-36">
      {ended && <p className="mb-4 rounded border border-black/10 bg-gray-50 p-3 text-center font-medium">यह लाइव कवरेज अब समाप्त हो गया है।</p>}

      {pending.count > 0 && (
        <div className="sticky top-35 z-20 mb-4 flex justify-center">
          <button type="button" onClick={reveal} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90">
            ↑ {pending.count} नए अपडेट
          </button>
        </div>
      )}

      {fresh.map((c) => <div key={c.key}>{c.node}</div>)}
      {children}
      {older.map((c) => <div key={c.key}>{c.node}</div>)}

      <div ref={sentinel} aria-hidden className="h-px" />

      {status === "loading" && (
        <div className="space-y-3 pl-5" role="status" aria-label="पुराने अपडेट लोड हो रहे हैं">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-7 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <p className="text-black/70">पुराने अपडेट लोड नहीं हो सके।</p>
          <button type="button" onClick={loadMore} className="mt-2 inline-flex h-10 items-center rounded-sm border border-primary px-5 font-medium text-primary hover:bg-primary hover:text-white">दोबारा कोशिश करें</button>
        </div>
      )}
    </div>
  );
}
