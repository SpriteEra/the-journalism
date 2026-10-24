import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, BarChart3, CalendarDays, UserCog, Clapperboard, Clock, Eye, FileText, Film, Images, Mail, Pencil, PlaySquare, Radio, ScrollText, ShieldCheck, TrendingUp, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import usePermission from "../../hooks/usePermission";
import { useActivityLogs, useReporterPerformance, useUserDetail } from "../../hooks/admin";
import { useFetchNews } from "../../hooks/news";
import { fmtDate } from "../../lib/api";
import { fmtIST } from "../../lib/time";
import RangePicker, { rangeFromDays } from "../../components/analytics/RangePicker";
import { ColumnChart, Donut, Gauge, RankBars, TrendChart } from "../../components/charts/Charts";
import PermissionOverridesPanel from "../../components/users/PermissionOverridesPanel";
import ProfileHeader from "../../components/profile/ProfileHeader";
import AccountActions from "../../components/users/AccountActions";
import { Button, Badge, Card, CardHeader, DataTable, EmptyState, ErrorState, PageHeader, Pagination, Skeleton, StatCard, StatusBadge, Tabs } from "../../components/ui";

const num = (n) => Number(n || 0).toLocaleString("en-IN");
const statusTone = (n) => (n.need_approval ? ["warning", "Needs approval"] : n.draft ? ["neutral", "Draft"] : n.isPublished ? ["success", "Published"] : ["neutral", "Unpublished"]);

function Block({ title, description, loading, children, className, height = "h-56", empty }) {
  return (
    <Card padded={false} className={className}>
      <CardHeader title={title} description={description} />
      <div className="p-3 sm:p-4">{loading ? <Skeleton className={`${height} w-full`} /> : empty ? <EmptyState fill={false} title={empty} className="py-8" /> : children}</div>
    </Card>
  );
}

/** Stories written by this person (same list API as the news page, filtered by author). */
function StoriesTab({ id }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(false);
  const { data, isPending, error, refetch } = useFetchNews({ page, limit: 10, draft, filters: { author: id } });
  return (
    <Card padded={false}>
      <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <Tabs variant="pill" value={draft ? "draft" : "live"} onChange={(v) => { setDraft(v === "draft"); setPage(1); }} items={[{ value: "live", label: t("Published") }, { value: "draft", label: t("Drafts") }]} />
        <Badge tone="primary" className="w-fit">{num(data?.total)} {t("stories")}</Badge>
      </div>
      {error ? <ErrorState error={error} onRetry={refetch} /> : (
        <DataTable rows={data?.news} loading={isPending} rowKey="news_id" empty={<EmptyState icon={FileText} title={t("No stories yet")} />} columns={[
          { key: "title", header: t("Title"), primary: true, cell: (n) => <Link to={`/dashboard/news/${n.news_id}`} className="hindi-font line-clamp-2 max-w-[16rem] font-medium text-fg hover:text-primary sm:max-w-md">{n.title}</Link> },
          { key: "cat", header: t("Category"), hideOnMobile: true, cell: (n) => (n.category || []).slice(0, 2).map((c) => c.name).join(", ") || "—" },
          { key: "status", header: t("Status"), cell: (n) => { const [tone, label] = statusTone(n); return <Badge tone={tone} dot size="sm">{t(label)}</Badge>; } },
          { key: "date", header: "Created", hideOnMobile: true, cell: (n) => <span className="text-xs">{fmtDate(n.createdAt, true)}</span> },
          { key: "reads", header: t("reads"), align: "right", cell: (n) => <b className="text-fg">{num(n.activity?.total_reads)}</b> },
        ]} />
      )}
      {Boolean(data?.total) && <Pagination page={page} total={data.total} limit={10} onPage={setPage} className="border-t border-line" />}
    </Card>
  );
}

/** What this person did inside the panel (admin-panel log, last 10 days). Needs logs.view. */
function ActivityTab({ id }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isPending, error, refetch } = useActivityLogs({ source: "admin", actor: id, page, limit: 15 });
  return (
    <Card padded={false}>
      <CardHeader icon={ScrollText} title={t("Activity")} description={t("Logs are kept for 10 days and then deleted automatically.")} />
      {error ? <ErrorState error={error} onRetry={refetch} /> : (
        <DataTable rows={data?.logs} loading={isPending} rowKey="_id" empty={<EmptyState icon={ScrollText} title={t("No activity yet")} />} columns={[
          { key: "when", header: t("When"), cell: (r) => <span className="whitespace-nowrap text-xs text-fg-muted">{fmtIST(r.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}</span> },
          { key: "action", header: t("Action"), primary: true, cell: (r) => <div className="min-w-0"><p className="text-sm font-medium text-fg">{r.action}</p>{r.entityId && <p className="max-w-[14rem] truncate font-mono text-[11px] text-fg-subtle sm:max-w-xs">{r.entityId}</p>}</div> },
          { key: "res", header: t("Result"), cell: (r) => <Badge size="sm" dot tone={r.statusCode < 400 ? "success" : "danger"}>{r.statusCode}</Badge> },
        ]} />
      )}
      {Boolean(data?.total) && <Pagination page={page} total={data.total} limit={15} onPage={setPage} className="border-t border-line" />}
    </Card>
  );
}

export default function ReporterProfile() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { can } = usePermission();
  const [range, setRange] = useState(() => rangeFromDays(30));
  const [tab, setTab] = useState("overview");
  const detail = useUserDetail(id);
  const perf = useReporterPerformance(id, range, can("reporter.performance.all"));
  const r = perf.data;
  const u = detail.data?.user;
  const rep = r?.reporter || {};
  const name = u?.fullName || u?.username || rep.fullName || rep.username || "…";

  const other = r?.otherContent;
  const uploads = other ? [
    { label: t("Stories"), icon: FileText, value: r.summary.published, views: r.summary.totalViews },
    { label: "Shorts", icon: PlaySquare, value: other.shortVideos?.shorts?.published || 0, views: other.shortVideos?.shorts?.views || 0 },
    { label: t("Shorts & videos"), icon: Clapperboard, value: other.shortVideos?.total?.published || 0, views: other.shortVideos?.total?.views || 0 },
    { label: t("YouTube news"), icon: Video, value: other.youtubeVideos.published, views: other.youtubeVideos.views },
    { label: t("Photo gallery"), icon: Images, value: other.gallery.published, views: other.gallery.views },
    { label: t("Events"), icon: CalendarDays, value: other.events.published, views: other.events.views },
    { label: "Live", icon: Radio, value: other.liveNews.published, views: other.liveNews.views },
  ] : [];
  const mix = uploads.filter((x) => x.label !== t("Shorts & videos") && x.value > 0).map((x) => ({ name: x.label, value: x.value }));
  const hours = useMemo(() => (r?.timing.byHour || []).map((h) => ({ hour: String(h.hour).padStart(2, "0"), Stories: h.articles, Reads: h.views })), [r]);
  const weekday = useMemo(() => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({ day: d, Stories: r?.timing.byWeekday.find((x) => x.isoWeekday === i + 1)?.articles || 0 })), [r]);

  if (detail.error) return <ErrorState error={detail.error} onRetry={detail.refetch} />;

  const tabs = [
    { value: "overview", label: t("Overview"), icon: BarChart3 },
    { value: "stories", label: t("Stories"), icon: FileText },
    { value: "uploads", label: t("Uploads"), icon: Film },
    can("logs.view") && { value: "activity", label: t("Activity"), icon: ScrollText },
    { value: "account", label: "Account", icon: UserCog },
    { value: "access", label: "Access", icon: ShieldCheck },
  ].filter(Boolean);

  return (
    <>
      {/* compact = small calendar menu on phones, full picker from sm up */}
      <PageHeader
        title={t("Profile")}
        breadcrumbs={[{ label: t("Reporters"), to: "/dashboard/reporters" }, { label: name }]}
        actions={can("reporter.performance.all") && <RangePicker compact value={range} onChange={setRange} />}
      />

      <ProfileHeader className="mb-4 sm:mb-5" name={name} src={u?.profile || rep.profile}
        badges={<>{u && <Badge tone={u.role === "admin" ? "accent" : "primary"} className="capitalize">{u.role}</Badge>}{u && (u.is_blocked ? <StatusBadge status="blocked" /> : <StatusBadge status="active" />)}
          {u && <Badge
            tone={u.trusted || u.role === "admin" ? "success" : "neutral"}
            size="sm"
          >
            {u.trusted || u.role === "admin" ? "Auto-publish" : "Needs review"}
          </Badge>
          }
        </>}
        subtitle={u?.designation ? `${u.designation}${u.location ? ` · ${u.location}` : ""}` : u?.location}
        about={u?.about}
        actions={can("user.update") && <Button as={Link} to={`/dashboard/reporters/${id}/edit`} size="sm" variant="outline" leftIcon={Pencil}>Edit profile</Button>}
        meta={<>{u && <span>@{u.username}</span>}{u && <span className="inline-flex min-w-0 items-center gap-1.5"><Mail className="size-4 shrink-0" /><span className="truncate">{u.email}</span></span>}{u && <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 shrink-0" />{t("Joined")} {fmtDate(u.createdAt)}</span>}{r?.summary.lastPublishedAt && <span className="inline-flex items-center gap-1.5"><Clock className="size-4 shrink-0" />{t("Last active")} {fmtDate(r.summary.lastPublishedAt)}</span>}</>}>
        {u?.is_blocked && <span className="absolute inset-x-0 bottom-0 bg-danger px-4 py-1.5 text-xs font-medium text-paper">Blocked{u.blockReason ? `: ${u.blockReason}` : ""}{u.blockedUntil ? ` · until ${fmtDate(u.blockedUntil)}` : ""}</span>}
      </ProfileHeader>

      {can("reporter.performance.all") && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-5 sm:gap-4 xl:grid-cols-4">
          <StatCard label={t("Stories published")} value={r?.summary.published ?? 0} icon={FileText} change={r?.comparison.publishedChangePercent} loading={perf.isLoading} hint="vs previous period" />
          <StatCard label={t("Total reads")} value={r?.summary.totalViews ?? 0} icon={Eye} tone="accent" change={r?.comparison.viewsChangePercent} loading={perf.isLoading} />
          <StatCard label="Avg reads / story" value={r?.summary.avgViewsPerArticle ?? 0} icon={TrendingUp} tone="info" loading={perf.isLoading} hint={r ? `best ${num(r.summary.bestArticleViews)}` : undefined} />
          <StatCard label="Team rank" value={r?.rank.byViews ? `#${r.rank.byViews}` : "—"} icon={Award} tone="warning" loading={perf.isLoading} hint={r ? `of ${r.rank.totalActiveReporters} reporters` : undefined} />
        </div>
      )}

      {/* swipeable tab row on phones */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:mb-5 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tabs value={tab} onChange={setTab} items={tabs} className="min-w-max" />
      </div>

      {tab === "overview" && (can("reporter.performance.all") ? (
        perf.error ? <ErrorState error={perf.error} onRetry={perf.refetch} /> : (
          <div className="space-y-4 sm:space-y-5">
            <Block title="Stories & reads" description="Per day in the selected range" loading={perf.isLoading} height="h-72">
              <TrendChart data={(r?.trends.daily || []).map((x) => ({ bucket: x.date, published: x.published, views: x.views }))} series={[{ key: "published", name: "Stories" }, { key: "views", name: "Reads" }]} height={280} />
            </Block>
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
              <Block title="Consistency" description={r ? `${r.summary.activeDays} active days · ${r.summary.articlesPerWeek} stories / week` : ""} loading={perf.isLoading}><Gauge value={r?.summary.consistencyPercent} label="days with a story" /></Block>
              <Block title={t("Category")} loading={perf.isLoading} empty={!(r?.breakdown.byCategory || []).length ? t("No stories yet") : null}><Donut data={(r?.breakdown.byCategory || []).slice(0, 6).map((c) => ({ name: c.name, value: c.articles }))} height={210} /></Block>
              <Block title="Top topics" loading={perf.isLoading} empty={!(r?.breakdown.topTags || []).length ? t("No stories yet") : null}><RankBars data={(r?.breakdown.topTags || []).slice(0, 6).map((x) => ({ name: x.name, value: x.articles }))} label="Stories" color="var(--chart-3)" /></Block>
            </div>
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
              <Block title="When they publish" description="Stories by hour (IST)" loading={perf.isLoading}><ColumnChart data={hours} xKey="hour" series={[{ key: "Stories", name: "Stories" }]} height={210} tickFormatter={(v) => (Number(v) % 3 === 0 ? v : "")} /></Block>
              <Block title="By weekday" loading={perf.isLoading}><ColumnChart data={weekday} xKey="day" series={[{ key: "Stories", name: "Stories", color: "var(--chart-2)" }]} height={210} /></Block>
            </div>
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
              <Block title="Top places" description="Stories by state" loading={perf.isLoading} empty={!(r?.breakdown.byState || []).length ? "No place data yet" : null}><RankBars data={(r?.breakdown.byState || []).slice(0, 6).map((s) => ({ name: s.name, value: s.articles }))} label="Stories" color="var(--chart-4)" /></Block>
              <Card padded={false}>
                <CardHeader icon={Award} title="Top stories" description="Most read in the range" />
                <DataTable rows={r?.topArticles} loading={perf.isLoading} rowKey="news_id" empty={<EmptyState fill={false} title={t("No stories yet")} className="py-10" />} columns={[
                  { key: "t", header: t("Title"), primary: true, cell: (a) => <Link to={`/dashboard/news/${a.news_id}`} className="hindi-font line-clamp-1 max-w-[12rem] font-medium text-fg hover:text-primary sm:max-w-xs">{a.title}</Link> },
                  { key: "v", header: t("reads"), align: "right", cell: (a) => <b className="text-fg">{num(a.views)}</b> },
                ]} />
              </Card>
            </div>
          </div>
        )
      ) : <Card className="flex min-h-[18rem] items-center"><EmptyState icon={BarChart3} title="Statistics are private" description="You need the “see every reporter's performance” permission to view detailed numbers." /></Card>)}

      {tab === "stories" && <StoriesTab id={id} />}

      {tab === "uploads" && (can("reporter.performance.all") ? (
        <div className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {uploads.map((x) => <StatCard key={x.label} label={x.label} value={x.value} icon={x.icon} tone="primary" loading={perf.isLoading} hint={`${num(x.views)} ${t("reads")}`} />)}
          </div>
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <Block title="Content mix" description="What this person uploads" loading={perf.isLoading} empty={!mix.length ? t("Nothing here yet") : null}><Donut data={mix} height={240} /></Block>
            <Block title="Month by month" description="Stories and reads per month" loading={perf.isLoading} empty={!(r?.trends.monthly || []).length ? t("Nothing here yet") : null}><ColumnChart data={(r?.trends.monthly || []).map((m) => ({ month: m.month, Stories: m.published, Reads: m.views }))} xKey="month" series={[{ key: "Stories", name: "Stories" }, { key: "Reads", name: "Reads", color: "var(--chart-2)" }]} height={240} /></Block>
          </div>
          {r && (
            <Card>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  ["Drafts", r.summary.drafts],
                  ["Awaiting approval", r.summary.pendingApproval],
                  ["Scheduled", r.summary.scheduledWaiting],
                  ["Deleted", r.summary.deleted],
                  [`All-time published · ${num(r.allTime.views)} ${t("reads")}`, num(r.allTime.published)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-surface-2 px-3 py-2.5">
                    <p className="text-lg font-semibold tabular-nums text-fg">{value}</p>
                    <p className="text-xs text-fg-subtle">{label}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : <Card className="flex min-h-[18rem] items-center"><EmptyState icon={Film} title="Statistics are private" /></Card>)}

      {tab === "activity" && <ActivityTab id={id} />}

      {tab === "account" && (u ? <AccountActions user={u} /> : <Skeleton className="h-64 w-full" />)}

      {tab === "access" && (u ? <PermissionOverridesPanel userId={id} role={u.role} /> : <Skeleton className="h-64 w-full" />)}
    </>
  );
}