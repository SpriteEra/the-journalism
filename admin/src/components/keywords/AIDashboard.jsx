import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3, Check, Clock, Copy, ExternalLink, Flame, Languages, Newspaper, RefreshCw, Rss, Search, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchRss, useFetchTopTrends } from "../../hooks/useTrends";
import { clearOra } from "../../lib/oraCache";
import { fmtISTDateTime, fmtISTTime } from "../../lib/time";
import { errMsg } from "../../lib/api";
import { cn } from "../../lib/cn";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorState, PageHeader, PremiumBadge, SearchInput, Skeleton, Tabs } from "../ui";

const SIX_HOURS = 6 * 3600_000;
const volume = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n || 0));
const PERKS = ["Real-time trending keywords", "AI keyword suggestions for every story", "Hindi + English", "RSS news feed", "Ranking score per keyword", "Top 10 high-impact picks"];

const copy = async (text, label = "Copied") => {
  try { await navigator.clipboard.writeText(text); toast.success(label); } catch { toast.error("Could not copy"); }
};

/** Dark ink panel with a fine gold edge and a light that sweeps across it — the same look as the Ora AI button in the top bar. */
function Hero({ updatedAt, fetching, onRefresh, count }) {
  return (
    <section className="relative mb-5 overflow-hidden rounded-[1.75rem] bg-linear-to-br from-gold-300 via-gold-500 to-gold-300 p-px shadow-card">
      <div className="relative overflow-hidden rounded-[calc(1.75rem-1px)] bg-ink p-5 text-paper sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-gold-500/20 blur-3xl" />
        <span aria-hidden className="ora-sweep pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="grid size-11 place-items-center rounded-2xl bg-linear-to-br from-gold-300 to-gold-500 text-gold-ink"><Sparkles className="ora-twinkle size-5" /></span>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ora AI <span className="bg-linear-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">Trend Intelligence</span></h1>
              <PremiumBadge cached>Premium</PremiumBadge>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-paper/70 sm:text-base">Our AI scans thousands of sources across search trends and gives you real-time keyword intelligence, so your stories are written around what readers are searching for right now.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {[[Zap, "Keywords", count ? `${count} live` : "—"], [Clock, "Refreshed", "every 6 hours"], [Languages, "Languages", "Hindi + English"]].map(([Icon, label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5"><p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-paper/50"><Icon className="size-3 text-gold-300" />{label}</p><p className="text-sm font-semibold">{value}</p></div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-paper/60">
              <span className="inline-flex items-center gap-1.5"><span className={cn("size-1.5 rounded-full", fetching ? "animate-pulse bg-gold-300" : "bg-success")} />{fetching ? "Refreshing…" : "Live"}</span>
              <span>{updatedAt ? `Updated ${fmtISTDateTime(updatedAt)} IST · next ${fmtISTTime(updatedAt + SIX_HOURS)}` : "Not loaded yet"}</span>
              <button type="button" onClick={onRefresh} disabled={fetching} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-medium text-paper hover:bg-white/10 disabled:opacity-60"><RefreshCw className={cn("size-3.5", fetching && "animate-spin")} />Refresh now</button>
            </div>
          </div>
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-5 lg:block">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gold-300">What you get</p>
            <ul className="space-y-2 text-sm text-paper/80">{PERKS.map((p) => <li key={p} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-gold-300" />{p}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const Rank = ({ n }) => (
  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold", n === 1 ? "bg-linear-to-br from-gold-300 to-gold-500 text-gold-ink" : n <= 3 ? "bg-gold-100 text-gold-700" : "bg-surface-3 text-fg-muted")}>{n}</span>
);

const ListSkeleton = ({ rows = 6 }) => <ul className="divide-y divide-line">{Array.from({ length: rows }).map((_, i) => <li key={i} className="flex items-center gap-3 p-4"><Skeleton className="size-8 rounded-full" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-5 w-12" /></li>)}</ul>;

function Top10({ items, loading, error, onRetry }) {
  return (
    <Card padded={false}>
      <CardHeader icon={Flame} title="Top 10 keywords" description="Highest search volume right now" actions={<><Badge tone="warning" size="sm">High impact</Badge>{items.length > 0 && <Button size="sm" variant="ghost" leftIcon={Copy} onClick={() => copy(items.map((i) => i.keyword).join(", "), "Top 10 copied")}>Copy all</Button>}</>} />
      {error ? <ErrorState error={error} onRetry={onRetry} /> : loading ? <ListSkeleton rows={6} /> : !items.length ? <EmptyState fill={false} icon={BarChart3} title="No keywords yet" className="py-10" /> : (
        <ol className="divide-y divide-line">
          {items.map((it) => (
            <li key={it.keyword}>
              <button type="button" onClick={() => copy(it.keyword, `“${it.keyword}” copied`)} className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 sm:px-5">
                <Rank n={it.rank} />
                <span className="min-w-0 flex-1">
                  <span className="hindi-font block truncate text-sm font-semibold capitalize text-fg">{it.keyword}</span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-3"><span className={cn("block h-full rounded-full", it.rank <= 3 ? "bg-linear-to-r from-gold-300 to-gold-500" : "bg-fg-faint")} style={{ width: `${it.score}%` }} /></span>
                </span>
                {it.volume > 0 && <Badge tone="success" size="sm">{volume(it.volume)}</Badge>}
                <Copy className="size-4 shrink-0 text-fg-faint opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function Trending({ keywords, loading, error, onRetry }) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const shown = keywords.filter((k) => k.toLowerCase().includes(q.trim().toLowerCase()));
  const list = all || q ? shown : shown.slice(0, 40);
  return (
    <Card padded={false}>
      <CardHeader icon={TrendingUp} title="Top 100 trending" description="Tap a keyword to copy it" actions={<Badge tone="success" size="sm" dot>Live</Badge>} />
      <div className="border-b border-line p-3 sm:p-4"><SearchInput value={q} onChange={setQ} placeholder="Search keywords…" /></div>
      {error ? <ErrorState error={error} onRetry={onRetry} /> : loading ? <div className="p-4"><Skeleton className="h-40 w-full" /></div> : !shown.length ? <EmptyState fill={false} icon={Search} title="No keyword found" className="py-10" /> : (
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {list.map((k) => <button key={k} type="button" onClick={() => copy(k, `“${k}” copied`)} className="hindi-font inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium capitalize text-fg-muted transition-colors hover:border-gold-500 hover:bg-gold-100/60 hover:text-fg"><TrendingUp className="size-3 text-gold-500" />{k}</button>)}
          </div>
          {!q && shown.length > 40 && <div className="mt-4 text-center"><Button size="sm" variant="outline" onClick={() => setAll((v) => !v)}>{all ? "Show fewer" : `Show all ${shown.length}`}</Button></div>}
        </div>
      )}
    </Card>
  );
}

function RssFeed({ items, loading, error, onRetry }) {
  return (
    <Card padded={false}>
      <CardHeader icon={Rss} title="News feed" description="Latest headlines of the last 24 hours · refreshed every 10 minutes" />
      {error ? <ErrorState error={error} onRetry={onRetry} /> : loading ? <ListSkeleton rows={5} /> : !items.length ? <EmptyState icon={Newspaper} title="No headlines available" description="Try again in a few minutes." /> : (
        <ol className="divide-y divide-line">
          {items.map((it, i) => {
            const link = it.link || it.url;
            return (
              <li key={it._id || i} className="flex items-start gap-3 px-4 py-4 sm:px-5">
                <span className="mt-0.5 w-6 shrink-0 text-right text-sm font-semibold text-fg-faint">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="hindi-font text-[15px] font-semibold leading-snug text-fg">{it.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
                    {it.state && <Badge size="sm" tone="info">{it.state}</Badge>}
                    {it.searchVolume > 0 && <Badge size="sm" tone="success">{volume(it.searchVolume)} searches</Badge>}
                    {(it.pubDate || it.capturedAt) && <span>{fmtISTDateTime(it.pubDate || it.capturedAt)}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon-sm" variant="ghost" aria-label="Copy headline" onClick={() => copy(it.title, "Headline copied")}><Copy className="size-4" /></Button>
                  {link && <a href={link} target="_blank" rel="noreferrer" aria-label="Open source" className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-surface-3 hover:text-fg"><ExternalLink className="size-4" /></a>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/** Ora AI page (Trends Hub). Premium look shared with the top-bar button; data is cached on the server, in the browser and in memory. */
export default function TrendsDashboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("all");
  const trends = useFetchTopTrends();
  const rss = useFetchRss();
  const rows = trends.data?.data || [];

  const top10 = useMemo(() => {
    const top = [...rows].sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0)).slice(0, 10);
    const max = top[0]?.searchVolume || 1;
    return top.map((it, i) => ({ rank: i + 1, keyword: it.keyword || it.normalizedKeyword || "—", volume: it.searchVolume || 0, score: Math.max(6, Math.round(((it.searchVolume || 0) / max) * 100)) }));
  }, [rows]);
  const keywords = useMemo(() => rows.slice(0, 100).map((r) => String(r.keyword || "").toLowerCase()).filter(Boolean), [rows]);
  const fetching = trends.isFetching || rss.isFetching;

  const refresh = useCallback(() => { clearOra(); qc.invalidateQueries({ queryKey: ["top-trends"] }); qc.invalidateQueries({ queryKey: ["rss-feed"] }); toast.success("Refreshing…"); }, [qc]);
  const err = (r) => (r.isError ? { message: errMsg(r.error, "Could not load this from Ora AI") } : null);
  const tErr = err(trends); const rErr = err(rss);

  return (
    <>
      <PageHeader title="Ora AI" description="Trending keywords and headlines to write around." actions={<PremiumBadge>PRO</PremiumBadge>} />
      <Hero updatedAt={trends.dataUpdatedAt} fetching={fetching} onRefresh={refresh} count={keywords.length} />
      <Tabs variant="pill" value={tab} onChange={setTab} className="mb-5" items={[{ value: "all", label: "Top 100" }, { value: "top10", label: "Top 10" }, { value: "rss", label: "News feed" }]} />
      {(tab === "all" || tab === "top10") && (
        <div className={cn("grid gap-5", tab === "all" && "lg:grid-cols-[24rem_minmax(0,1fr)]")}>
          <Top10 items={top10} loading={trends.isLoading} error={tErr} onRetry={trends.refetch} />
          {tab === "all" && <Trending keywords={keywords} loading={trends.isLoading} error={tErr} onRetry={trends.refetch} />}
        </div>
      )}
      {tab === "rss" && <RssFeed items={rss.data?.data || []} loading={rss.isLoading} error={rErr} onRetry={rss.refetch} />}
    </>
  );
}
