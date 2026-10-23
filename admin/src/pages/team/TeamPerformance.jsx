import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, BarChart3, ChevronsDown, Eye, FileText, Flame, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAnalyticsDashboard, useReportersLeaderboard } from "../../hooks/admin";
import { fmtDate } from "../../lib/api";
import { cn } from "../../lib/cn";
import { handleImageError } from "../../utils/imageError";
import RangePicker, { rangeFromDays } from "../../components/analytics/RangePicker";
import { ColumnChart, Donut, RankBars } from "../../components/charts/Charts";
import { Avatar, Badge, Card, CardHeader, DataTable, EmptyState, ErrorState, PageHeader, Skeleton, StatCard, Tabs } from "../../components/ui";

const num = (n) => Number(n || 0).toLocaleString("en-IN");
const SORTS = [["views", "Most reads"], ["published", "Most stories"], ["avgViews", "Best average"], ["activeDays", "Most active days"]];
const MEDAL = ["bg-gold-300 text-gold-ink", "bg-surface-3 text-fg", "bg-warning-soft text-warning"];

const label = (r) => r.reporter.fullName || r.reporter.username || "—";

/** Collapsible leaderboard row for phones (below sm). Collapsed: rank, avatar, name, reads. Open: all numbers + profile link. */
function ReporterCard({ r }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="group flex w-full items-center gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold", MEDAL[r.rank - 1] || "bg-surface-2 text-fg-muted")}>{r.rank}</span>
        <Avatar name={label(r)} src={r.reporter.profile} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{label(r)}</p>
          <span className="mt-0.5 flex items-center gap-1 text-[10px] italic text-red-500 transition-colors group-hover:text-fg">
            {open ? "Hide details" : "View details"}
            <ChevronsDown className={`size-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-fg"><Eye className="size-3.5 text-fg-subtle" aria-hidden />{num(r.views)}</p>
          <p className="text-[11px] text-fg-subtle">{num(r.published)} stories</p>
        </div>
      </button>

      <div id={id} className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden" inert={open ? undefined : ""}>
          <div className="space-y-3 border-t border-line p-3">
            <dl className="grid grid-cols-3 gap-2">
              {[
                { l: "Stories", v: num(r.published) },
                { l: "Reads", v: num(r.views) },
                { l: "Avg reads", v: num(r.avgViews) },
              ].map((s) => (
                <div key={s.l} className="rounded-md bg-surface-2 px-2.5 py-2">
                  <dt className="text-[11px] text-fg-subtle">{s.l}</dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums text-fg">{s.v}</dd>
                </div>
              ))}
            </dl>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3"><dt className="text-xs text-fg-subtle">Role</dt><dd className="capitalize text-fg">{r.reporter.role}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-xs text-fg-subtle">Active days</dt><dd className="text-fg">{r.activeDays}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-xs text-fg-subtle">Last active</dt><dd className="text-fg">{r.lastPublishedAt ? fmtDate(r.lastPublishedAt) : "—"}</dd></div>
            </dl>
            <Link to={`/dashboard/reporters/${r.reporter._id}`} className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-line bg-surface text-sm font-medium text-fg-muted transition-colors active:bg-surface-2">View profile</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Team performance: who published how much, how it was read, and what is trending this week. */
export default function TeamPerformance() {
  const { t } = useTranslation();
  const [range, setRange] = useState(() => rangeFromDays(30));
  const [sort, setSort] = useState("views");
  const board = useReportersLeaderboard(range, sort);
  const week = useAnalyticsDashboard(useMemo(() => rangeFromDays(7), []), true);      // trending news of the last 7 days
  const rows = board.data || [];
  const totals = useMemo(() => {
    const published = rows.reduce((a, r) => a + r.published, 0); const views = rows.reduce((a, r) => a + r.views, 0);
    return { published, views, avg: published ? Math.round(views / published) : 0, active: rows.filter((r) => r.published > 0).length };
  }, [rows]);
  const top = rows.filter((r) => r.published > 0).slice(0, 8);
  const trending = week.data?.data?.topArticles || [];
  const trendTags = (week.data?.data?.tags || []).slice(0, 8);

  const columns = [
    { key: "rank", header: "#", cell: (r) => <span className={cn("grid size-7 place-items-center rounded-full text-xs font-semibold", MEDAL[r.rank - 1] || "bg-surface-2 text-fg-muted")}>{r.rank}</span> },
    {
      key: "who", header: t("Reporters"), primary: true, cell: (r) => (
        <Link to={`/dashboard/reporters/${r.reporter._id}`} className="flex items-center gap-3 hover:opacity-80"><Avatar name={label(r)} src={r.reporter.profile} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-medium text-fg">{label(r)}</p><p className="text-[11px] capitalize text-fg-subtle">{r.reporter.role}</p></div></Link>)
    },
    { key: "published", header: t("Stories"), align: "right", cell: (r) => <b className="text-fg">{num(r.published)}</b> },
    { key: "views", header: t("reads"), align: "right", cell: (r) => num(r.views) },
    { key: "avg", header: "Avg", align: "right", cell: (r) => num(r.avgViews) },
    { key: "days", header: "Active days", align: "right", cell: (r) => r.activeDays },
    { key: "last", header: t("Last active"), cell: (r) => <span className="text-xs text-fg-subtle">{r.lastPublishedAt ? fmtDate(r.lastPublishedAt) : "—"}</span> },
  ];

  const sortTabs = <Tabs variant="pill" value={sort} onChange={setSort} items={SORTS.map(([value, l]) => ({ value, label: l }))} />;

  if (board.error) return <ErrorState error={board.error} onRetry={board.refetch} />;

  return (
    <>
      {/* compact = small calendar menu on phones, full picker from sm up */}
      <PageHeader title="Team performance" description="Stories published, reads and activity of every reporter — and what readers liked this week." actions={<RangePicker compact value={range} onChange={setRange} />} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Team stories" value={totals.published} icon={FileText} tone="black" loading={board.isLoading} />
        <StatCard label="Team reads" value={totals.views} icon={Eye} tone="info" loading={board.isLoading} />
        <StatCard label="Avg reads / story" value={totals.avg} icon={BarChart3} tone="violet" loading={board.isLoading} />
        <StatCard label={t("Active reporters")} value={totals.active} icon={Users} tone="warning" loading={board.isLoading} hint={`of ${rows.length} on the team`} />
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Card padded={false} className="lg:col-span-2">
          <CardHeader icon={BarChart3} title="Stories and reads per reporter" description="Top 8 in the selected range" />
          <div className="p-4">{board.isLoading ? <Skeleton className="h-72 w-full" /> : top.length ? <ColumnChart height={280} xKey="name" data={top.map((r) => ({ name: label(r).split(" ")[0], Stories: r.published, Reads: r.views }))} series={[{ key: "Stories", name: "Stories" }, { key: "Reads", name: "Reads", color: "var(--chart-2)" }]} /> : <EmptyState fill={false} title="No published stories in this range" className="py-10" />}</div>
        </Card>
        <Card padded={false}>
          <CardHeader title="Share of reads" description="Who brings the readers" />
          <div className="p-4">{board.isLoading ? <Skeleton className="h-72 w-full" /> : top.length ? <Donut height={280} data={top.slice(0, 6).map((r) => ({ name: label(r), value: r.views }))} /> : <EmptyState fill={false} title={t("Nothing here yet")} className="py-10" />}</div>
        </Card>
      </div>

      <Card padded={false} className="mb-5">
        {/* sort tabs sit in the header from sm up; on phones they get their own scrollable row */}
        <CardHeader icon={Trophy} title="Leaderboard" actions={<div className="hidden sm:block">{sortTabs}</div>} />
        <div className="overflow-x-auto border-b border-line px-3 py-2 sm:hidden">{sortTabs}</div>
        <DataTable
          breakpoint="sm"
          columns={columns}
          rows={rows}
          loading={board.isLoading}
          rowKey={(r) => r.reporter._id}
          mobileCard={(r) => <ReporterCard r={r} />}
          empty={<EmptyState icon={Users} title="No reporters in this range" />}
        />
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card padded={false} className="lg:col-span-2">
          <CardHeader icon={Flame} title="Trending this week" description="Most read stories published in the last 7 days" actions={<Badge tone="warning" size="sm">7 days</Badge>} />
          {week.isLoading ? <div className="space-y-3 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div> : trending.length ? (
            <ol className="divide-y divide-line">
              {trending.slice(0, 8).map((a, i) => (
                <li key={a.news_id}>
                  <Link to={`/dashboard/news/${a.news_id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-surface-2/60 sm:gap-4 sm:px-5">
                    <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold sm:size-8 sm:text-sm", MEDAL[i] || "bg-surface-2 text-fg-muted")}>{i + 1}</span>
                    <img src={`${a.banner}?q=60&w=160`} alt="" loading="lazy" onError={handleImageError} className="h-12 w-16 shrink-0 rounded-lg bg-surface-3 object-cover sm:w-20" />
                    <span className="min-w-0 flex-1"><span className="hindi-font line-clamp-2 text-sm font-medium text-fg">{a.title}</span><span className="line-clamp-1 text-xs text-fg-subtle">{a.category?.[0]?.name} · {a.author?.username} · {fmtDate(a.post_time)}</span></span>
                    <Badge tone="primary" size="sm"><Eye className="size-3" />{num(a.activity?.total_reads)}</Badge>
                  </Link>
                </li>
              ))}
            </ol>
          ) : <EmptyState icon={Flame} title="Nothing trending yet" description="Stories published in the last 7 days will appear here." />}
        </Card>
        <Card padded={false}>
          <CardHeader icon={Award} title="Trending topics" description="Topics of the last 7 days" />
          <div className="p-4">{week.isLoading ? <Skeleton className="h-64 w-full" /> : trendTags.length ? <RankBars data={trendTags.map((x) => ({ name: x.name, value: x.articles }))} label="Stories" color="var(--chart-4)" /> : <EmptyState fill={false} title={t("Nothing here yet")} className="py-10" />}</div>
        </Card>
      </div>
    </>
  );
}