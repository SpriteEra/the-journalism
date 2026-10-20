import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, BarChart3, Eye, FileText, Flame, Trophy, Users } from "lucide-react";
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

  const label = (r) => r.reporter.fullName || r.reporter.username || "—";
  const columns = [
    { key: "rank", header: "#", cell: (r) => <span className={cn("grid size-7 place-items-center rounded-full text-xs font-semibold", MEDAL[r.rank - 1] || "bg-surface-2 text-fg-muted")}>{r.rank}</span> },
    { key: "who", header: t("Reporters"), primary: true, cell: (r) => (
      <Link to={`/dashboard/reporters/${r.reporter._id}`} className="flex items-center gap-3 hover:opacity-80"><Avatar name={label(r)} src={r.reporter.profile} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-medium text-fg">{label(r)}</p><p className="text-[11px] capitalize text-fg-subtle">{r.reporter.role}</p></div></Link>) },
    { key: "published", header: t("Stories"), align: "right", cell: (r) => <b className="text-fg">{num(r.published)}</b> },
    { key: "views", header: t("reads"), align: "right", cell: (r) => num(r.views) },
    { key: "avg", header: "Avg", align: "right", hideOnMobile: true, cell: (r) => num(r.avgViews) },
    { key: "days", header: "Active days", align: "right", hideOnMobile: true, cell: (r) => r.activeDays },
    { key: "last", header: t("Last active"), hideOnMobile: true, cell: (r) => <span className="text-xs text-fg-subtle">{r.lastPublishedAt ? fmtDate(r.lastPublishedAt) : "—"}</span> },
  ];

  if (board.error) return <ErrorState error={board.error} onRetry={board.refetch} />;

  return (
    <>
      <PageHeader title="Team performance" description="Stories published, reads and activity of every reporter — and what readers liked this week." actions={<RangePicker value={range} onChange={setRange} />} />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Team stories" value={totals.published} icon={FileText} tone="success" loading={board.isLoading} />
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
        <CardHeader icon={Trophy} title="Leaderboard" actions={<Tabs variant="pill" value={sort} onChange={setSort} items={SORTS.map(([value, l]) => ({ value, label: l }))} />} />
        <DataTable columns={columns} rows={rows} loading={board.isLoading} rowKey={(r) => r.reporter._id} empty={<EmptyState icon={Users} title="No reporters in this range" />} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card padded={false} className="lg:col-span-2">
          <CardHeader icon={Flame} title="Trending this week" description="Most read stories published in the last 7 days" actions={<Badge tone="warning" size="sm">7 days</Badge>} />
          {week.isLoading ? <div className="space-y-3 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div> : trending.length ? (
            <ol className="divide-y divide-line">
              {trending.slice(0, 8).map((a, i) => (
                <li key={a.news_id}>
                  <Link to={`/dashboard/news/${a.news_id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2/60 sm:px-5">
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold", MEDAL[i] || "bg-surface-2 text-fg-muted")}>{i + 1}</span>
                    <img src={`${a.banner}?q=60&w=160`} alt="" loading="lazy" onError={handleImageError} className="h-12 w-20 shrink-0 rounded-lg bg-surface-3 object-cover" />
                    <span className="min-w-0 flex-1"><span className="hindi-font line-clamp-2 text-sm font-medium text-fg">{a.title}</span><span className="text-xs text-fg-subtle">{a.category?.[0]?.name} · {a.author?.username} · {fmtDate(a.post_time)}</span></span>
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
