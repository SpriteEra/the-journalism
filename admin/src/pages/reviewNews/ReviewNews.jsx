import { useState } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, Clock, ListChecks, Newspaper, Radio, RefreshCw, Video } from "lucide-react";
import { cn } from "../../lib/cn";
import { fmtDate } from "../../lib/api";
import { useReviewQueue } from "../../hooks/review";
import { handleImageError } from "../../utils/imageError";
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, Skeleton, Tabs } from "../../components/ui";

const META = { news: { label: "News", icon: Newspaper }, yt: { label: "YouTube news", icon: Video }, short: { label: "Shorts", icon: Clapperboard }, live: { label: "Live", icon: Radio } };

export default function ReviewNews() {
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const { data, isPending, isFetching, isError, error, refetch } = useReviewQueue({ type, status, page, limit, search: q });

  const counts = data?.counts || {};
  const tabs = [
    { value: "all", label: "All", icon: ListChecks, count: Object.values(counts).reduce((a, b) => a + b, 0) },
    ...Object.keys(counts).map((k) => ({ value: k, label: META[k].label, icon: META[k].icon, count: counts[k] })),
  ];

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Review queue" description="News, videos, shorts and live coverage that wait for your approval."
        actions={<Button variant="outline" onClick={() => refetch()} disabled={isFetching} aria-label="Reload" title="Reload" className="!px-2.5"><RefreshCw className={cn("size-4", isFetching && "animate-spin")} /></Button>} />

      <Card padded={false} className="mb-3">
        <div className="min-w-0 overflow-x-auto border-b border-line px-3 pt-2 sm:px-4">
          <Tabs value={type} onChange={(v) => { setType(v); setPage(1); }} items={tabs} className="border-b-0" />
        </div>
        <div className="flex flex-col gap-2 p-2 sm:flex-row sm:items-center sm:p-3">
          <form className="min-w-0 flex-1" onSubmit={(e) => { e.preventDefault(); setQ(search.trim()); setPage(1); }}>
            <SearchInput value={search} onChange={(v) => { setSearch(v); if (!v) { setQ(""); setPage(1); } }} placeholder="Search by title (Enter)" />
          </form>
          <div className="flex gap-1.5">
            <Button size="sm" variant={status === "pending" ? "primary" : "outline"} onClick={() => { setStatus("pending"); setPage(1); }}>Waiting</Button>
            <Button size="sm" variant={status === "rejected" ? "primary" : "outline"} onClick={() => { setStatus("rejected"); setPage(1); }}>Rejected</Button>
          </div>
        </div>
      </Card>

      {isError ? <Card><ErrorState error={error} onRetry={refetch} /></Card>
        : isPending ? <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
          : !data.items.length ? <Card className="flex min-h-72 items-center"><EmptyState icon={ListChecks} title={status === "pending" ? "Nothing is waiting for review" : "No rejected items"} /></Card>
            : (
              <div className={cn("space-y-3 transition-opacity", isFetching && "opacity-70")}>
                {data.items.map((it) => {
                  const rejected = Boolean(it.rejected_at);
                  const Icon = META[it.type]?.icon || Newspaper;
                  return (
                    <Link key={`${it.type}-${it.id}`} to={`/dashboard/review/${it.type}/${it.id}`} className="surface-card flex gap-3 p-2 transition-shadow hover:shadow-pop sm:p-3">
                      <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-surface-3 sm:w-44">
                        {it.thumbnail && <img src={it.thumbnail} alt="" loading="lazy" onError={handleImageError} className="absolute inset-0 size-full object-cover" />}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="accent" size="sm"><Icon className="size-3" />{it.typeLabel}</Badge>
                          {rejected && <Badge tone="danger" size="sm" dot>Rejected</Badge>}
                        </div>
                        <p className="hindi-font line-clamp-2 font-semibold text-fg">{it.title}</p>
                        {rejected && it.rejected_reason && <p className="line-clamp-2 text-xs text-danger">{it.rejected_reason}</p>}
                        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle">
                          <span className="inline-flex items-center gap-1.5"><Avatar name={it.author?.fullName || it.author?.username} src={it.author?.profile} size="xs" /><span className="truncate font-medium text-fg-muted">{it.author?.fullName || it.author?.username}</span></span>
                          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{fmtDate(it.updatedAt, true)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

      {Boolean(data?.total) && <Card padded={false} className="mt-4"><Pagination page={page} total={data.total} limit={limit} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} limits={[12, 24, 48]} /></Card>}
    </div>
  );
}