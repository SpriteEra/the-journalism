import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Clapperboard, Eye, FileText, Hourglass, MoreVertical, PlaySquare, Plus, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import usePermission from "../../hooks/usePermission";
import { useAnalyticsDashboard, useTodayReads } from "../../hooks/admin";
import { fmtDate } from "../../lib/api";
import { rangeFromDays } from "../../components/analytics/RangePicker";
import { ColumnChart, Donut, Gauge, RankBars, TrendChart } from "../../components/charts/Charts";
import { buttonStyles } from "../../components/ui/Button";
import InfoTip from "../../components/ui/InfoTip"; // adjust the path if needed
import { Badge, Card, CardHeader, EmptyState, ErrorState, Skeleton, StatCard } from "../../components/ui";

const greetingKey = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
const num = (n) => Number(n || 0).toLocaleString("en-IN");
// "today" = live read count only; every other option ends yesterday
const RANGES = [["today", "Today"], ["1", "Yesterday"], ["7", "7d"], ["14", "14d"], ["30", "30d"]];

function Block({ title, description, info, loading, children, className, actions, height = "h-60", empty }) {
  return (
    <Card padded={false} className={className}>
      <CardHeader
        title={title}
        description={description}
        actions={(actions || info) ? (
          <>
            {actions}
            {info && <InfoTip align="end" label={`About: ${title}`}>{info}</InfoTip>}
          </>
        ) : undefined}
      />
      <div className="p-4">{loading ? <Skeleton className={`${height} w-full`} /> : empty ? <EmptyState fill={false} title={empty} className="py-8" /> : children}</div>
    </Card>
  );
}

function QuickActions({ can, inline = false }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const actions = [
    can("news.create") && { to: "/dashboard/news/create", label: t("Write news"), icon: Plus, primary: true },
    can("news.approve") && { to: "/dashboard/review-news", label: t("Review queue"), icon: Hourglass },
    can(["video.create"]) && { to: "/dashboard/short-videos", label: t("Shorts & videos"), icon: PlaySquare },
  ].filter(Boolean);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    }
    setOpen((o) => !o);
  };

  // close on outside tap, Escape, scroll, resize
  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (!actions.length) return null;

  return (
    <>
      {/* sm and up (or inline): normal buttons */}
      <div className={`${inline ? "flex" : "hidden sm:flex"} flex-wrap gap-2`}>
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className={buttonStyles({ variant: a.primary ? "primary" : "outline" })}>
            <a.icon className="size-4" />{a.label}
          </Link>
        ))}
      </div>

      {/* below sm: three-dot menu */}
      {!inline && (
        <div className="sm:hidden">
          <button
            ref={btnRef}
            type="button"
            onClick={toggle}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={t("Quick actions")}
            className={`${buttonStyles({ variant: "outline" })} !px-2.5`}
          >
            <MoreVertical className="size-4" />
          </button>

          {open && createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: pos.top, right: pos.right }}
              className="fixed z-[100] min-w-52 max-w-[calc(100vw-1rem)] rounded-xl border border-line bg-surface p-1.5 shadow-card"
            >
              {actions.map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface-2 ${a.primary ? "text-primary" : "text-fg"}`}
                >
                  <a.icon className="size-4" />{a.label}
                </Link>
              ))}
            </div>,
            document.body
          )}
        </div>
      )}
    </>
  );
}

export default function Overview() {
  const { t } = useTranslation();
  const { user, can } = usePermission();
  const [days, setDays] = useState("today");
  const isToday = days === "today";          // live read count only
  const isDay = isToday || days === "1";     // dashboard data is a single day (yesterday)
  const range = useMemo(() => rangeFromDays(isToday ? 1 : Number(days), { excludeToday: true }), [days, isToday]);
  const canSee = can("analytics.view");

  // dashboard data must be read BEFORE anything below uses isLoading / o
  const { data, isLoading, error, refetch } = useAnalyticsDashboard(range, canSee);
  const d = data?.data; const o = d?.overview;

  // today's real reads (news + yt + short + live) from the live counters: the only number that includes today
  const { data: today, isLoading: todayLoading } = useTodayReads(canSee && isToday);
  const todayReads = today ? (today.Newscount || 0) + (today.Ytcount || 0) + (today.Shortcount || 0) + (today.Livecount || 0) : 0;
  const heroLoading = isLoading || (isToday && todayLoading);

  const pending = d?.approval?.pending ?? 0;
  const aging = d?.approval?.aging;

  const readsChange = Number(o?.news.change.readsPercent);
  const hasComparison = !isDay && Number.isFinite(readsChange) && (o?.news.readsInRange || 0) > 0;

  const heroStats = isToday
    ? [["Reads today", todayReads], ["Waiting for review", pending], ["Published yesterday", o?.news.published]]
    : isDay
      ? [["Published yesterday", o?.news.published], ["Reads yesterday", o?.news.readsInRange], ["Reporters active", o?.news.activeReporters]]
      : [["Stories", o?.news.published], ["Reads", o?.news.readsInRange], ["Reporters", o?.news.activeReporters]];

  // reads per hour of day, summed over the weekday x hour heat map
  const byHour = useMemo(() => {
    const grid = d?.heatmap?.grid;
    if (!grid) return [];
    return Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, "0")}`, reads: grid.reduce((a, row) => a + (row[h]?.views || 0), 0), stories: grid.reduce((a, row) => a + (row[h]?.articles || 0), 0) }));
  }, [d]);
  const seriesOf = (k) => (d?.timeseries.series || []).map((x) => x[k] || 0);
  const bestHour = useMemo(() => [...byHour].sort((a, b) => b.reads - a.reads)[0], [byHour]);

  const content = o?.otherContent;
  const contentMix = content ? [
    { name: "Stories", value: o.news.published }, { name: "Shorts & videos", value: content.shortVideos?.total?.published || 0 }, { name: "YouTube news", value: content.youtubeVideos?.published || 0 },
    { name: "Gallery", value: content.gallery?.published || 0 }, { name: "Events", value: content.events?.published || 0 }, { name: "Live", value: content.liveNews?.published || 0 },
  ].filter((x) => x.value > 0) : [];
  const periodLabel = isDay ? "yesterday" : "in this period";

  return (
    <div className="space-y-4">
      {/* hero (Nexora style: light card, soft mint / sky glow, headline numbers) */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-[1.75rem] border border-line bg-surface p-4 shadow-card sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[26rem] rounded-full bg-linear-to-br from-accent/25 via-info/15 to-transparent blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 size-[24rem] rounded-full bg-info/10 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:gap-6">
          <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-4">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs font-medium text-fg-muted backdrop-blur"><Sparkles className="size-3.5" />Insights · {isToday ? "today" : isDay ? "yesterday" : `last ${days} days`}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs font-medium text-fg-muted backdrop-blur"><span className="size-1.5 rounded-full bg-success" />Live</span>
            </div>
            <div className="flex flex-col items-end gap-2 sm:gap-3">
              <QuickActions can={can} />
              <p className="hidden text-sm text-fg-subtle sm:block">{fmtDate(new Date())}</p>
            </div>
          </div>
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{t(greetingKey())}, {user?.fullName || user?.username}</h1>
            {canSee && !heroLoading
              ? <p className="mt-3 text-sm sm:text-base leading-relaxed text-fg-subtle sm:text-lg">
                {isToday
                  ? <>So far today: <b className="text-fg">{num(todayReads)}</b> reads, with <b className="text-fg">{pending} {pending === 1 ? "story" : "stories"}</b> waiting for review.</>
                  : isDay
                    ? <>Yesterday: <b className="text-fg">{num(o?.news.published)}</b> {o?.news.published === 1 ? "story" : "stories"} published and <b className="text-fg">{num(o?.news.readsInRange)}</b> reads, with <b className="text-fg">{pending} {pending === 1 ? "story" : "stories"}</b> waiting for review.</>
                    : <>Here is how the newsroom is doing{hasComparison && <> - reads are {readsChange >= 0 ? "up" : "down"} <b className="text-fg">{Math.abs(readsChange)}%</b> on the previous period</>}, with <b className="text-fg">{pending} {pending === 1 ? "story" : "stories"}</b> waiting for review.</>}
              </p>
              : <p className="mt-3 text-base text-fg-subtle sm:text-lg">{canSee ? "Loading your numbers…" : "Pick a section from the menu to get started."}</p>}
          </div>
          {canSee && (
            <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
              {heroStats.map(([l, v]) => (
                <div key={l} className="border-l border-line pl-4 first:border-0 first:pl-0"><p className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">{l}</p><p className="text-2xl font-semibold text-fg">{heroLoading ? "—" : num(v)}</p></div>
              ))}
              <div className="ml-auto inline-flex rounded-full bg-surface-3 p-1" role="tablist" aria-label="Range">
                {RANGES.map(([id, label]) => <button key={id} role="tab" aria-selected={days === id} onClick={() => setDays(id)} className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${days === id ? "bg-surface text-fg shadow-sm" : "text-fg-subtle hover:text-fg"}`}>{label}</button>)}
              </div>
            </div>
          )}
        </div>
      </section>

      {!canSee ? (
        <Card className="flex min-h-[20rem] items-center"><EmptyState icon={Sparkles} title="Welcome to the admin panel" description="Use the menu to open the sections you have access to." action={<QuickActions can={can} />} /></Card>
      ) : error ? <ErrorState error={error} onRetry={refetch} /> : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={isDay ? t("Stories published yesterday") : t("Stories published")} value={o?.news.published ?? 0} icon={FileText} tone="black" change={isDay ? undefined : o?.news.change.publishedPercent} loading={isLoading} spark={isDay ? undefined : seriesOf("published")} rows={[["Avg reads / new story", num(o?.news.avgViews)], ["Reporters active", num(o?.news.activeReporters)]]} />
            <StatCard label={isToday ? t("Reads today") : isDay ? t("Reads yesterday") : t("Reads")} value={isToday ? todayReads : (o?.news.readsInRange ?? 0)} icon={Eye} tone="info" change={isDay ? undefined : o?.news.change.readsPercent} loading={heroLoading} rows={[["Best hour", bestHour?.reads ? `${bestHour.hour}:00` : "—"], ["Top story", num(d?.topArticles?.[0]?.activity?.total_reads)]]} />
            <StatCard label={t("Waiting for review")} value={pending} icon={Hourglass} tone="warning" loading={isLoading} hint={aging ? `${aging.over24h} waiting over 24h` : undefined} invert rows={[["Avg approval", `${d?.approval?.avgApprovalHours ?? 0}h`], ["Approved in range", num(d?.approval?.approvedInRange)]]} />
            <StatCard label={t("Shorts & videos")} value={content?.shortVideos?.total?.published ?? 0} icon={Clapperboard} tone="violet" loading={isLoading} rows={[["YouTube news", num(content?.youtubeVideos?.published)], ["Photo galleries", num(content?.gallery?.published)]]} />
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            {isDay ? (
              <Block className="xl:col-span-2" title={t("Yesterday by hour")} description="Stories published for each hour of yesterday (IST)" loading={isLoading} height="h-72" empty={!byHour.some((h) => h.reads || h.stories) ? "Nothing yesterday" : null}
                info="Number of stories published in each hour of yesterday (IST), and the lifetime reads of those stories. Today is not included, so this shows the last complete day."
                actions={<Link to="/dashboard/analytics" className="text-sm font-medium text-primary hover:underline">{t("Full analytics →")}</Link>}>
                <ColumnChart data={byHour} xKey="hour" series={[{ key: "stories", name: "Stories" }, { key: "reads", name: "Reads" }]} height={290} tickFormatter={(v) => (Number(v) % 3 === 0 ? v : "")} />
              </Block>
            ) : (
              <Block className="xl:col-span-2" title={t("Publishing & reads")} description="Stories published per day and their reads" loading={isLoading} height="h-72"
                info="Stories published each day, and the lifetime reads of those stories. Reads are counted against the day the story was published, not the day it was read."
                actions={<Link to="/dashboard/analytics" className="text-sm font-medium text-primary hover:underline">{t("Full analytics →")}</Link>}>
                <TrendChart data={d?.timeseries.series || []} series={[{ key: "published", name: "Stories" }, { key: "views", name: "Reads" }]} height={290} />
              </Block>
            )}
            <Block title={t("Category mix")} description="Stories per category" loading={isLoading} height="h-72" empty={!(d?.categories || []).length ? `No categories ${periodLabel}` : null}
              info="Share of stories published in this period by category (top 6). A story with several categories counts once in each.">
              <Donut data={(d?.categories || []).slice(0, 6).map((c) => ({ name: c.name, value: c.articles }))} height={290} />
            </Block>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            <Block title={t("Best publishing hours")} description={bestHour?.reads ? `Most-read stories were published around ${bestHour.hour}:00 IST` : "Reads by hour of day (IST)"} loading={isLoading} empty={!byHour.some((h) => h.reads || h.stories) ? "Not enough data yet" : null}
              info="Lifetime reads of stories, grouped by the hour they were published (IST). It shows the best hours to publish, not when readers were online.">
              <ColumnChart data={byHour} xKey="hour" series={[{ key: "reads", name: "Reads" }]} height={230} tickFormatter={(v) => (Number(v) % 3 === 0 ? v : "")} />
            </Block>
            <Block title={t("Top reporters")} description={`By reads ${periodLabel}`} loading={isLoading} empty={!(d?.reporters || []).length ? "No published stories yet" : null}
              info="Reporters ranked by the lifetime reads of the stories they published in this period (top 6).">
              <RankBars data={(d?.reporters || []).slice(0, 6).map((r) => ({ name: r.reporter.username, value: r.views }))} label="Reads" color="var(--chart-2)" />
            </Block>
            <Block title={t("Content by state")} description="Stories per state" loading={isLoading} empty={!(d?.states || []).length ? "No state data yet" : null}
              info="Number of stories published in this period for each state (top 6).">
              <RankBars data={(d?.states || []).slice(0, 6).map((s) => ({ name: s.name, value: s.articles }))} label="Stories" color="var(--chart-3)" />
            </Block>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            <Block title={t("Review pipeline")} description="Stories waiting for an approver" loading={isLoading} height="h-56"
              info="Stories currently waiting for approval, by how long they have waited. The gauge is the percentage that has waited less than 24 hours; 100% means nothing is overdue. It does not depend on the selected range.">
              <div className="grid grid-cols-2 items-center gap-2">
                <Gauge value={pending ? Math.max(0, 100 - Math.min(100, (aging?.over24h || 0) / pending * 100)) : 100} label="on time (< 24h)" color={pending && aging?.over24h ? "var(--warning)" : "var(--success)"} height={170} />
                <ul className="space-y-2 text-sm">
                  {[["Waiting", pending, "warning"], ["> 6 hours", aging?.over6h || 0, "info"], ["> 24 hours", aging?.over24h || 0, "danger"], ["> 72 hours", aging?.over72h || 0, "danger"]].map(([l, v, tone]) => (
                    <li key={l} className="flex items-center justify-between gap-2"><span className="text-fg-subtle">{l}</span><Badge tone={tone} size="sm">{v}</Badge></li>
                  ))}
                  <li className="flex items-center justify-between gap-2 border-t border-line pt-2"><span className="text-fg-subtle">Avg approval</span><b className="text-fg">{d?.approval?.avgApprovalHours ?? 0}h</b></li>
                </ul>
              </div>
            </Block>
            <Block title="Content mix" description={isDay ? "Everything published yesterday" : "Everything published in this period"} loading={isLoading} empty={!contentMix.length ? "Nothing published yet" : null}
              info="Share of each kind of content (stories, shorts and videos, YouTube news, gallery, events, live) published in this period.">
              <Donut data={contentMix} height={230} />
            </Block>
            <Card padded={false}>
              <CardHeader title={t("Top stories")} description={isDay ? t("Most read, published yesterday") : t("Most read in this period")}
                actions={<InfoTip align="end" label="About: Top stories">The stories published in this period with the most lifetime reads (top 6).</InfoTip>} />
              <ol className="divide-y divide-line">
                {isLoading ? [0, 1, 2, 3, 4].map((i) => <li key={i} className="p-4"><Skeleton className="h-4 w-full" /></li>) : (d?.topArticles || []).length ? d.topArticles.slice(0, 6).map((a, i) => (
                  <li key={a.news_id}>
                    <Link to={`/dashboard/news/${a.news_id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-surface-2/60">
                      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary-soft text-xs font-semibold text-primary">{i + 1}</span>
                      <span className="min-w-0 flex-1"><span className="hindi-font line-clamp-2 text-sm font-medium text-fg">{a.title}</span><span className="text-xs text-fg-subtle">{a.category?.[0]?.name} · {a.author?.username}</span></span>
                      <Badge tone="primary" size="sm"><Eye className="size-3" />{num(a.activity?.total_reads)}</Badge>
                    </Link>
                  </li>
                )) : <li><EmptyState fill={false} title={t("No stories yet")} className="py-10" /></li>}
              </ol>
            </Card>
          </div>

          {d?.dataQuality && (d.dataQuality.publishedWithoutCategory > 0 || d.dataQuality.publishedWithoutTags > 0) && (
            <Card className="border-warning/40 bg-warning-soft/40">
              <p className="text-sm text-fg-muted"><b className="text-fg">Heads-up:</b> {d.dataQuality.publishedWithoutCategory} published stories have no category and {d.dataQuality.publishedWithoutTags} have no topic – they won't appear in category / topic pages.</p>
            </Card>
          )}
        </>
      )}

      {canSee && (
        <p className="pt-2 text-center text-xs text-fg-faint">
          {isToday
            ? "Only today's read count is live. All other figures are up to yesterday, and today's data will be complete tomorrow."
            : "Today's data isn't included. It will be visible tomorrow."}
        </p>
      )}
    </div>
  );
}