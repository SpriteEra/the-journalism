import { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { useNewsLinkSearch } from "../../hooks/news";
import { handleImageError } from "../../utils/imageError";
import { fmtDate } from "../../lib/api";
import { cn } from "../../lib/cn";
import { Badge, Skeleton } from "../ui";

export const RELATED_MAX = 5;

/** Search box + the chosen stories (max 5). value = [{ news_id, title, banner }] */
export default function RelatedNewsPicker({ value = [], onChange, selfId }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 300); return () => clearTimeout(t); }, [q]);
  const { data = [], isFetching } = useNewsLinkSearch(debounced, selfId);
  const full = value.length >= RELATED_MAX;
  const chosen = new Set(value.map((x) => x.news_id));
  const results = data.filter((n) => !chosen.has(n.news_id));
  const add = (n) => { if (!full) onChange([...value, { news_id: n.news_id, title: n.title, banner: n.banner }]); };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
        <input value={q} onChange={(e) => setQ(e.target.value)} disabled={full} placeholder={full ? `You have added ${RELATED_MAX} stories` : "Search a published story by title or keyword"}
          className="hindi-font h-11 w-full rounded-control border border-line-strong bg-surface pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-fg-faint focus:border-fg disabled:bg-surface-2" />
      </div>

      {debounced.trim().length >= 2 && !full && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line" aria-label="Search results">
          {isFetching && !data.length ? [0, 1].map((i) => <li key={i} className="p-3"><Skeleton className="h-10 w-full" /></li>)
            : results.length ? results.map((n) => (
              <li key={n.news_id}>
                <button type="button" onClick={() => add(n)} className="flex w-full items-center gap-3 p-2.5 text-left transition-colors hover:bg-surface-2">
                  <img src={`${n.banner}?q=60&w=120`} alt="" onError={handleImageError} className="h-10 w-16 shrink-0 rounded-md bg-surface-3 object-cover" />
                  <span className="min-w-0 flex-1"><span className="hindi-font line-clamp-1 text-sm font-medium text-fg">{n.title}</span><span className="text-xs text-fg-subtle">{fmtDate(n.post_time)}</span></span>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-fg text-canvas"><Plus className="size-4" /></span>
                </button>
              </li>
            )) : <li className="p-4 text-center text-sm text-fg-subtle">No published story found</li>}
        </ul>
      )}

      {value.length > 0 && (
        <ol className="space-y-2">
          {value.map((n, i) => (
            <li key={n.news_id} className={cn("flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5")}>
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-fg-muted">{i + 1}</span>
              <img src={`${n.banner}?q=60&w=120`} alt="" onError={handleImageError} className="h-10 w-16 shrink-0 rounded-md bg-surface-3 object-cover" />
              <span className="hindi-font line-clamp-2 min-w-0 flex-1 text-sm font-medium text-fg">{n.title}</span>
              <button type="button" aria-label={`Remove ${n.title}`} onClick={() => onChange(value.filter((x) => x.news_id !== n.news_id))} className="grid size-8 shrink-0 place-items-center rounded-full text-fg-subtle hover:bg-danger-soft hover:text-danger"><X className="size-4" /></button>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-fg-faint">{value.length}/{RELATED_MAX} linked. Only published stories can be linked. They appear under the story as “Read also”.</p>
    </div>
  );
}
