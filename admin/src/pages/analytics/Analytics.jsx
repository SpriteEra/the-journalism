import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Clock, Eye, FileText, Film, Flame, Layers, Users } from "lucide-react";
import usePermission from "../../hooks/usePermission";
import { useAnalyticsDashboard, useReporterPerformance } from "../../hooks/admin";
import { fmtDate } from "../../lib/api";
import RangePicker, { rangeFromDays } from "../../components/analytics/RangePicker";
import { ColumnChart, Donut, Gauge, Heatmap, LinesChart, RankBars, TrendChart } from "../../components/charts/Charts";
import { Alert, Avatar, Badge, Card, CardHeader, DataTable, EmptyState, ErrorState, InfoTip, PageHeader, Skeleton, StatCard, Tabs } from "../../components/ui";
import cn from "../../lib/cn";
import { handleImageError } from "../../utils/imageError";
import { MEDAL } from "../team/TeamPerformance";

const num = (n) => Number(n || 0).toLocaleString("en-IN");
const WEEKDAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Block = ({ title, description, info, children, loading, className, height = "h-64" }) => (
  <Card padded={false} className={className}>
    <CardHeader
      title={title}
      description={description}
      actions={info ? <InfoTip align="end" label={`About: ${title}`}>{info}</InfoTip> : undefined}
    />
    <div className="p-4">{loading ? <Skeleton className={`${height} w-full`} /> : children}</div>
  </Card>
);

/** Admin dashboard – needs analytics.view. */
function AdminAnalytics() {
  const [range, setRange] = useState(() => rangeFromDays(30, { excludeToday: true }));
  const [tab, setTab] = useState("overview");
  const [dim, setDim] = useState("categories");
  const { data, isLoading, isFetching, error, refetch } = useAnalyticsDashboard(range);
  const week = useAnalyticsDashboard(useMemo(() => rangeFromDays(7, { excludeToday: true }), []), true);
  const d = data?.data;
  const o = d?.overview;
  const cache = data?.cache;
  const grid = d?.heatmap?.grid;
  const byHour = useMemo(() => (grid ? Array.from({ length: 24 }, (_, h) => ({ hour: String(h).padStart(2, "0"), Reads: grid.reduce((a, r) => a + (r[h]?.views || 0), 0), Stories: grid.reduce((a, r) => a + (r[h]?.articles || 0), 0) })) : []), [grid]);
  const byWeekday = useMemo(() => (grid ? grid.map((row, i) => ({ day: WEEKDAY[i], Reads: row.reduce((a, c) => a + c.views, 0), Stories: row.reduce((a, c) => a + c.articles, 0) })) : []), [grid]);
  const repBars = useMemo(() => (d?.reporters || []).slice(0, 8).map((r) => ({ name: r.reporter.username, Stories: r.published, Reads: r.views })), [d]);


  const trending = week.data?.data?.topArticles || [];
  const trendTags = (week.data?.data?.tags || []).slice(0, 8);

  const dimRows = useMemo(() => {
    if (!d) return [];
    const rows = {
      categories: d.categories,
      states: d.states,
      // districts: d.districts, 
      tags: d.tags
    }[dim] || [];
    return rows.map((r) => ({ name: r.name, value: r.articles, views: r.views, avgViews: r.avgViews }));
  }, [d, dim]);

  const repCols = [
    { key: "rank", header: "#", cell: (r) => <span className="font-semibold text-fg">{r.rank}</span> },
    { key: "reporter", header: "Reporter", primary: true, cell: (r) => <div className="flex items-center gap-2.5"><Avatar size="sm" name={r.reporter.username} src={r.reporter.profile} /><div><Link to={`/dashboard/reporters/${r.reporter._id}`} className="font-medium text-fg hover:text-primary">{r.reporter.username}</Link><p className="text-xs text-fg-subtle capitalize">{r.reporter.role}</p></div></div> },
    { key: "published", header: "Stories", cell: (r) => num(r.published) },
    { key: "views", header: "Reads", cell: (r) => num(r.views) },
    { key: "avg", header: "Avg reads", cell: (r) => num(r.avgViews) },
    { key: "days", header: "Active days", cell: (r) => r.activeDays },
    { key: "last", header: "Last story", hideOnMobile: true, cell: (r) => <span className="text-xs">{fmtDate(r.lastPublishedAt)}</span> },
  ];

  return (
    <>
      {/* actions: full picker from sm up, one small menu button on phones (handled inside RangePicker) */}
      <PageHeader
        title="Analytics"
        description="Performance of stories, topics and your team. Figures are cached on the server for a couple of minutes."
        actions={<RangePicker compact excludeToday value={range} onChange={setRange} />}
      />
      {cache && <p className="mb-3 text-[11px] text-fg-faint sm:-mt-3 sm:mb-4 sm:text-xs">Data {cache.status === "HIT" ? "from cache" : cache.status === "STALE" ? "refreshing…" : "fresh"}{cache.ageSeconds ? ` · ${cache.ageSeconds}s old` : ""}{isFetching && !isLoading ? " · updating…" : ""}</p>}

      {/* tabs scroll sideways on phones instead of squeezing */}
      <div className="-mx-1 mb-4 overflow-x-auto px-1 sm:mb-5">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "overview", label: "Overview", icon: BarChart3 },
            { value: "content", label: "Content", icon: Layers },
            { value: "team", label: "Team", icon: Users },
            { value: "timing", label: "Timing", icon: Clock }
          ]}
        />
      </div>

      {error ? <ErrorState error={error} onRetry={refetch} /> : (
        <div className="space-y-5">
          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <StatCard label="Stories published" value={o?.news.published ?? 0} icon={FileText} change={o?.news.change.publishedPercent} loading={isLoading} hint="vs previous period" />
                {/* <StatCard label="Reads" value={o?.news.views ?? 0} icon={Eye} tone="accent" change={o?.news.change.viewsPercent} loading={isLoading} /> */}
                <StatCard label="Reads" value={o?.news.readsInRange ?? 0} icon={Eye} tone="accent" change={o?.news.change.readsPercent} loading={isLoading} hint="all content in this period" />
                {/* <StatCard label="Avg reads / story" value={o?.news.avgViews ?? 0} icon={BarChart3} tone="info" loading={isLoading} /> */}
                <StatCard label="Avg reads / new story" value={o?.news.avgViews ?? 0} icon={BarChart3} tone="info" loading={isLoading} hint="lifetime reads of stories published in range" />
                <StatCard label="Shorts & videos" value={o?.otherContent.shortVideos.total.published ?? 0} icon={Film} tone="warning" loading={isLoading}
                  hint={o ? `${o.otherContent.shortVideos.uploaded.published} uploaded · ${o.otherContent.shortVideos.youtube.published} YouTube` : undefined} />
              </div>
              <Block title="Publishing & reads over time" loading={isLoading} height="h-72"
                info="Stories published each day, and the lifetime reads of those stories. Reads are counted against the day the story was published, not the day it was read.">
                <TrendChart data={d?.timeseries.series || []} series={[{ key: "published", name: "Stories" }, { key: "views", name: "Reads" }]} />
              </Block>
              <div className="grid gap-5 lg:grid-cols-2">
                <Block title="Daily reads (all content)" description="Nightly snapshot" loading={isLoading}
                  info="Reads that actually happened on each day across all content, taken from the nightly snapshot. This can show reads even on days with no new stories.">
                  <TrendChart data={(d?.timeseries.traffic || []).map((t) => ({ bucket: t.date, reads: t.reads }))} series={[{ key: "reads", name: "Reads" }]} height={220} />

                </Block>
                <Block title="Where the effort goes" description="Stories per category" loading={isLoading}
                  info="Share of stories published in this period by category (top 6). A story with several categories counts once in each.">
                  <Donut data={(d?.categories || []).slice(0, 6).map((c) => ({ name: c.name, value: c.articles }))} />

                </Block>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <Block title="Stories by weekday" description="When the newsroom publishes" loading={isLoading}
                  info="Stories published and their lifetime reads, grouped by weekday of the publish time (IST)."><ColumnChart data={byWeekday} xKey="day" series={[{ key: "Stories", name: "Stories" }, { key: "Reads", name: "Reads", color: "var(--chart-2)" }]} height={220} /></Block>
                <Block title="Stories by hour (IST)" description="Publishing and reads across the day" loading={isLoading}
                  info="Number of stories published in each hour of the day (IST), summed over the whole period."><ColumnChart data={byHour} xKey="hour" series={[{ key: "Stories", name: "Stories" }]} height={220} tickFormatter={(v) => (Number(v) % 3 === 0 ? v : "")} /></Block>
              </div>
              <Card padded={false}>
                <CardHeader title="Top stories" actions={<InfoTip align="end">The 10 stories published in this period with the most lifetime reads.</InfoTip>} />
                <DataTable rows={d?.topArticles} loading={isLoading} rowKey="news_id" columns={[
                  { key: "title", header: "Story", primary: true, cell: (a) => <Link to={`/dashboard/news/${a.news_id}`} className="line-clamp-1 max-w-md font-medium text-fg hover:text-primary">{a.title}</Link> },
                  { key: "cat", header: "Category", cell: (a) => a.category?.[0]?.name || "—" },
                  { key: "by", header: "By", cell: (a) => a.author?.username },
                  { key: "date", header: "Published", cell: (a) => <span className="text-xs">{fmtDate(a.post_time)}</span> },
                  { key: "views", header: "Reads", align: "right", cell: (a) => <b className="text-fg">{num(a.activity?.total_reads)}</b> },
                ]} />
              </Card>
            </>
          )}

          {tab === "content" && (
            <>
              <Tabs variant="pill" value={dim} onChange={setDim} items={[{ value: "categories", label: "Categories" },
              { value: "states", label: "States" },
              // { value: "districts", label: "Districts" },
              { value: "tags", label: "Tags" }]}
              />
              <div className="grid gap-5 lg:grid-cols-2">
                <Block title="Stories" loading={isLoading} height="h-80"
                  info="Number of stories published in this period for each category, state or tag, highest first.">{dimRows.length ? <RankBars data={dimRows} label="Stories" /> : <EmptyState title="No data in this range" />}</Block>
                <Block title="Reads" loading={isLoading} height="h-80"
                  info="Lifetime reads of the stories published in this period, grouped by category, state or tag.">{dimRows.length ? <RankBars data={[...dimRows].sort((a, b) => b.views - a.views)} valueKey="views" label="Reads" color="var(--chart-2)" /> : <EmptyState title="No data in this range" />}</Block>
              </div>
              {d?.quietCategories?.length > 0 && dim === "categories" && (
                <Alert tone="warning" title="Categories with no stories in this period">
                  <div className="mt-1 flex flex-wrap gap-1.5">{d.quietCategories.map((c) => <Badge key={c._id} tone="warning">{c.name}</Badge>)}</div>
                </Alert>
              )}
              <Card padded={false} className="lg:col-span-2">
                <CardHeader icon={Flame} title="Trending this week" description="Most read stories published in the last 7 days" actions={<>
                  <Badge tone="warning" size="sm">7 days</Badge>
                  <InfoTip align="end">Most read stories published in the last 7 days, ending yesterday.</InfoTip>
                </>} />
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
            </>
          )}

          {tab === "team" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Waiting for approval" value={d?.approval.pending ?? 0} tone="warning" loading={isLoading} hint={d ? `${d.approval.aging.over24h} older than 24h` : undefined} />
                <StatCard label="Avg approval time" value={d ? `${d.approval.avgApprovalHours}h` : 0} tone="info" loading={isLoading} />
                <StatCard label="Approved in period" value={d?.approval.approvedInRange ?? 0} tone="success" loading={isLoading} />
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                <Block className="lg:col-span-2" title="Stories & reads per reporter" description="Top 8 by reads" loading={isLoading} height="h-72"
                  info="Stories published and their lifetime reads for the 8 reporters with the most reads in this period.">{repBars.length ? <ColumnChart data={repBars} series={[{ key: "Stories", name: "Stories" }, { key: "Reads", name: "Reads", color: "var(--chart-2)" }]} height={260} /> : <EmptyState fill={false} title="No published stories in this range" />}</Block>
                <Block title="Approval on time" description="Pending stories waiting under 24h" loading={isLoading}
                  info="Percentage of stories currently waiting for approval that have been waiting less than 24 hours. 100% means nothing is overdue."><Gauge value={d?.approval.pending ? 100 - Math.min(100, (d.approval.aging.over24h / d.approval.pending) * 100) : 100} label="on time" color={d?.approval.aging.over24h ? "var(--warning)" : "var(--success)"} /></Block>
              </div>
              <Card padded={false}>
                <CardHeader title="Reporter leaderboard" description="Ranked by reads"
                  actions={<InfoTip align="end">Reporters ranked by lifetime reads of the stories they published in this period. Active days is the number of different days they published.</InfoTip>} />
                <DataTable columns={repCols} rows={d?.reporters} loading={isLoading} rowKey="rank" empty={<EmptyState title="No published stories in this range" />} />
              </Card>
              <Card padded={false}>
                <CardHeader title="People by role"
                  actions={<InfoTip align="end">Total users by role right now. This does not depend on the selected date range.</InfoTip>} />
                <div className="grid items-center gap-4 p-4 sm:grid-cols-2"><Donut data={(o?.people.byRole || []).map((r) => ({ name: r.role, value: r.users }))} height={200} /><div className="flex flex-wrap gap-3">{(o?.people.byRole || []).map((r) => <div key={r.role} className="rounded-xl border border-line px-4 py-3"><p className="text-xl font-semibold text-fg">{r.users}</p><p className="text-xs capitalize text-fg-subtle">{r.role}{r.blocked ? ` · ${r.blocked} blocked` : ""}</p></div>)}</div></div>
              </Card>
            </>
          )}

          {tab === "timing" && (
            <Block title="When do readers engage?" description={d?.heatmap.bestSlot ? `Best slot: ${WEEKDAY[d.heatmap.bestSlot.weekday - 1]} around ${d.heatmap.bestSlot.hour}:00 (IST)` : "Stories by weekday and hour, shaded by reads"} loading={isLoading} info="Each cell is a weekday and hour (IST). Darker means more lifetime reads on stories published in that slot. The best slot is the one with the most reads.">
              {d && <Heatmap grid={d.heatmap.grid} />}
            </Block>
          )}
          {tab === "timing" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <Block title="Reads by hour" loading={isLoading}><ColumnChart data={byHour} xKey="hour" series={[{ key: "Reads", name: "Reads", color: "var(--chart-2)" }]} tickFormatter={(v) => (Number(v) % 3 === 0 ? v : "")} info="Lifetime reads of stories, grouped by the hour they were published (IST). It shows the best hours to publish, not when readers were online." /></Block>
              <Block title="Reads by weekday" loading={isLoading} info="Reads and stories grouped by the weekday the story was published."><LinesChart data={byWeekday} xKey="day" series={[{ key: "Reads", name: "Reads" }, { key: "Stories", name: "Stories" }]} /></Block>
            </div>
          )}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-fg-faint">
        Today's data isn't included. It will be visible tomorrow.
      </p>
    </>
  );
}

/** Reporters without analytics.view only see their own report. */
function MyPerformance() {
  const [range, setRange] = useState(() => rangeFromDays(30, { excludeToday: true }));
  const { data: r, isLoading, error, refetch } = useReporterPerformance("me", range);
  return (
    <>
      <PageHeader title="My performance" description="How your stories are doing." actions={<RangePicker compact excludeToday value={range} onChange={setRange} />} />
      {error ? <ErrorState error={error} onRetry={refetch} /> : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard label="Stories published" value={r?.summary.published ?? 0} icon={FileText} change={r?.comparison.publishedChangePercent} loading={isLoading} />
            <StatCard label="Total reads" value={r?.summary.totalViews ?? 0} icon={Eye} tone="accent" change={r?.comparison.viewsChangePercent} loading={isLoading} />
            <StatCard label="Avg reads / story" value={r?.summary.avgViewsPerArticle ?? 0} icon={BarChart3} tone="info" loading={isLoading} />
            <StatCard label="Active days" value={r ? `${r.summary.activeDays} (${r.summary.consistencyPercent}%)` : 0} icon={Clock} tone="success" loading={isLoading} hint={r?.rank.byViews ? `Rank #${r.rank.byViews} of ${r.rank.totalActiveReporters}` : undefined} />
          </div>
          <Block title="Stories per day" loading={isLoading}
            info="Your stories published each day and the lifetime reads of those stories.">
            <TrendChart
              data={(r?.trends.daily || []).map((x) => ({ bucket: x.date || x.day || x._id, published: x.published ?? x.articles, views: x.views }))}
              series={[{ key: "published", name: "Stories" }, { key: "views", name: "Reads" }]}
            />
          </Block>
          <div className="grid gap-5 lg:grid-cols-2">
            <Block title="Top categories" loading={isLoading}
              info="Categories where you published the most stories in this period."><RankBars data={(r?.breakdown.byCategory || []).map((c) => ({ name: c.name, value: c.articles }))} label="Stories" /></Block>
            <Card padded={false}><CardHeader title="Your top stories"
              actions={<InfoTip align="end">Your stories from this period with the most reads.</InfoTip>} /><DataTable rows={r?.topArticles} loading={isLoading} rowKey="news_id" columns={[{ key: "title", header: "Story", primary: true, cell: (a) => <span className="line-clamp-1 font-medium text-fg">{a.title}</span> }, { key: "views", header: "Reads", align: "right", cell: (a) => num(a.activity?.total_reads ?? a.views) }]} /></Card>
          </div>
        </div>
      )}
      <p className="mt-6 text-center text-xs text-fg-faint">
        Today's data isn't included. It will be visible tomorrow.
      </p>
    </>
  );
}

export default function Analytics() {
  const { can } = usePermission();
  return can("analytics.view") ? <AdminAnalytics /> : <MyPerformance />;
}