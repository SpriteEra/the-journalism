import Link from "next/link";

/**
 * Previous / next links (?page=N). Plain links, so every page can be opened, shared and indexed.
 * `basePath` may already carry a query string (e.g. "/search?q=modi").
 */
export default function Pagination({ basePath, page = 1, hasMore = false, className = "" }) {
  if (page <= 1 && !hasMore) return null;
  const href = (p) => { const sep = basePath.includes("?") ? "&" : "?"; return p <= 1 ? basePath : `${basePath}${sep}page=${p}`; };
  const base = "inline-flex h-10 items-center rounded-sm border px-5 text-base font-medium transition-colors";
  return (
    <nav aria-label="Pages" className={`mt-8 flex items-center justify-between gap-3 ${className}`}>
      {page > 1 ? <Link href={href(page - 1)} rel="prev" className={`${base} border-black/15 hover:border-primary hover:text-primary`}>← पिछला</Link> : <span />}
      <span className="text-sm text-black/60">पेज {page}</span>
      {hasMore ? <Link href={href(page + 1)} rel="next" className={`${base} border-primary bg-primary text-white hover:opacity-90`}>अगला →</Link> : <span />}
    </nav>
  );
}
