"use client";
import { useEffect } from "react";

/**
 * Counts ONE read for a real visitor. The server counts a read each time its related-news endpoint is called, so it is called
 * here (in the browser, through our own /api/view route) and not while the page is being built — bots and page rebuilds do not count.
 * Once per tab per story.
 */
export default function ReadBeacon({ id }) {
  useEffect(() => {
    if (!id) return;
    const key = `read:${id}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* private mode: count anyway */ }
    const t = setTimeout(() => { fetch(`/api/view/${encodeURIComponent(id)}`, { method: "POST", keepalive: true }).catch(() => { }); }, 3000);   // a visit shorter than 3 s is not a read
    return () => clearTimeout(t);
  }, [id]);
  return null;
}
