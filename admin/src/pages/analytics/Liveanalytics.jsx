import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Clock, Eye, RefreshCw, Users } from "lucide-react";
import usePermission from "../../hooks/usePermission";
import { useLiveBreakdown, useLiveContent, useLiveSummary } from "../../hooks/admin";
import { Donut, LinesChart } from "../../components/charts/Charts";
import { Alert, Avatar, Badge, Button, Card, CardHeader, DataTable, EmptyState, ErrorState, InfoTip, PageHeader, Pagination, Select, Skeleton, StatCard, Tabs } from "../../components/ui";
import { cn } from "../../lib/cn";
import { handleImageError } from "../../utils/imageError";

const num = (n) => Number(n || 0).toLocaleString("en-IN");

const WINDOWS = [
    { value: "today", label: "Today" },
    { value: "24h", label: "Last 24 hours" },
];
const TYPE_OPTIONS = [
    { value: "all", label: "All content" },
    { value: "news", label: "News" },
    { value: "yt", label: "YouTube news" },
    { value: "short", label: "Shorts & videos" },
    { value: "live", label: "Live news" },
];
const DIMENSIONS = [
    { value: "category", label: "Categories" },
    { value: "state", label: "States" },
    { value: "reporter", label: "Reporters" },
    { value: "type", label: "Content type" },
];
const TYPE_LABEL = { news: "News", yt: "YouTube", short: "Short / video", live: "Live" };

const Block = ({ title, description, info, children, loading, className, height = "h-64" }) => (
    <Card padded={false} className={className}>
        <CardHeader title={title} description={description} actions={info ? <InfoTip align="end" label={`About: ${title}`}>{info}</InfoTip> : undefined} />
        <div className="p-4">{loading ? <Skeleton className={`${height} w-full`} /> : children}</div>
    </Card>
);

/** ▲ 12% / ▼ 8% against the comparison period */
const Change = ({ value }) => {
    if (value === null || value === undefined) return <span className="text-fg-faint">—</span>;
    if (!value) return <span className="text-xs text-fg-subtle">0%</span>;
    const up = value > 0;
    return <span className={cn("text-xs font-medium tabular-nums", up ? "text-success" : "text-danger")}>{up ? "▲" : "▼"} {Math.abs(value)}%</span>;
};

/** share of all reads, drawn as a small bar */
const Share = ({ value }) => (
    <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(value || 0, 100)}%` }} /></div>
        <span className="text-xs tabular-nums text-fg-muted">{value}%</span>
    </div>
);

const istTime = (iso) => (iso ? new Date(iso).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) : "");

function Live() {
    const [win, setWin] = useState("today");
    const [type, setType] = useState("all");
    const [sort, setSort] = useState("reads");
    const [dim, setDim] = useState("category");
    const [cPage, setCPage] = useState(1);
    const [cLimit, setCLimit] = useState(10);
    const [bPage, setBPage] = useState(1);
    const [bLimit, setBLimit] = useState(10);

    const base = { window: win, type };
    const summary = useLiveSummary(base);
    const content = useLiveContent({ ...base, sort, page: cPage, limit: cLimit });
    const breakdown = useLiveBreakdown({ ...base, dimension: dim, page: bPage, limit: bLimit });

    const resetPages = () => { setCPage(1); setBPage(1); };
    const changeWindow = (v) => { setWin(v); resetPages(); };
    const changeType = (v) => { setType(v); resetPages(); };
    const reload = () => { summary.refetch(); content.refetch(); breakdown.refetch(); };
    const fetching = summary.isFetching || content.isFetching || breakdown.isFetching;

    const s = summary.data?.data;
    const k = s?.kpis;
    const cache = summary.data?.cache;
    const isToday = win === "today";
    const curName = isToday ? "Today" : "Last 24 hours";
    const prevName = isToday ? "Yesterday" : "Previous 24 hours";

    const chart = useMemo(() => (s?.timeline || []).map((t) => ({ label: t.label, current: t.reads, previous: t.previous })), [s]);
    const donut = useMemo(() => (s?.byType || []).filter((t) => t.reads > 0).map((t) => ({ name: t.label, value: t.reads })), [s]);

    const cData = content.data?.data;
    const cRows = useMemo(() => (cData?.rows || []).map((r, i) => ({ ...r, rank: (cPage - 1) * cLimit + i + 1, rowId: `${r.type}:${r.id}` })), [cData, cPage, cLimit]);
    const bData = breakdown.data?.data;
    const bRows = useMemo(() => (bData?.rows || []).map((r, i) => ({ ...r, rank: (bPage - 1) * bLimit + i + 1 })), [bData, bPage, bLimit]);

    const contentCols = [
        { key: "rank", header: "#", cell: (r) => <span className="font-semibold text-fg">{r.rank}</span> },
        {
            key: "title", header: "Story", primary: true, cell: (r) => (
                <div className="flex items-center gap-3">
                    {r.image ? <img src={r.type === "news" ? `${r.image}?q=60&w=160` : r.image} alt="" loading="lazy" onError={handleImageError} className="h-10 w-14 shrink-0 rounded-md bg-surface-3 object-cover" /> : <div className="h-10 w-14 shrink-0 rounded-md bg-surface-3" />}
                    {r.type === "news"
                        ? <Link to={`/dashboard/news/${r.id}`} className="hindi-font line-clamp-2 max-w-md font-medium text-fg hover:text-primary">{r.title}</Link>
                        : <span className="hindi-font line-clamp-2 max-w-md font-medium text-fg">{r.title}</span>}
                </div>
            ),
        },
        { key: "type", header: "Type", hideOnMobile: true, cell: (r) => <Badge size="sm">{TYPE_LABEL[r.type] || r.type}</Badge> },
        { key: "reads", header: "Reads", align: "right", cell: (r) => <b className="text-fg">{num(r.reads)}</b> },
        { key: "change", header: "Change", align: "right", cell: (r) => <Change value={r.changePercent} /> },
        { key: "share", header: "Share", hideOnMobile: true, cell: (r) => <Share value={r.sharePercent} /> },
    ];

    const breakdownCols = [
        { key: "rank", header: "#", cell: (r) => <span className="font-semibold text-fg">{r.rank}</span> },
        {
            key: "name", header: "Name", primary: true, cell: (r) => (dim === "reporter"
                ? <div className="flex items-center gap-2.5"><Avatar size="sm" name={r.username || r.name} src={r.profile} /><span className="font-medium text-fg">{r.name}</span></div>
                : <span className="font-medium text-fg">{r.name}</span>),
        },
        { key: "reads", header: "Reads", align: "right", cell: (r) => <b className="text-fg">{num(r.reads)}</b> },
        { key: "change", header: "Change", align: "right", cell: (r) => <Change value={r.changePercent} /> },
        { key: "share", header: "Share", hideOnMobile: true, cell: (r) => <Share value={r.sharePercent} /> },
    ];

    return (
        <>
            <PageHeader
                title="Live analytics"
                description="Reads hour by hour, for today or the last 24 hours, compared with the same hours a day earlier."
                actions={(
                    <div className="flex flex-wrap items-center gap-2">
                        <Tabs variant="pill" value={win} onChange={changeWindow} items={WINDOWS} />
                        <div className="w-40"><Select size="sm" aria-label="Content type" value={type} onChange={(e) => changeType(e.target.value)} options={TYPE_OPTIONS} /></div>
                        <Button variant="outline" onClick={reload} disabled={fetching} aria-label="Reload" title="Reload" className="!px-2.5">
                            <RefreshCw className={cn("size-4", fetching && "animate-spin")} />
                        </Button>
                    </div>
                )}
            />
            {s && (
                <p className="mb-3 text-[11px] text-fg-faint sm:-mt-3 sm:mb-4 sm:text-xs">
                    Updated {istTime(s.asOf)} IST{cache ? ` · ${cache.status === "HIT" ? "from cache" : cache.status === "STALE" ? "refreshing…" : "fresh"}${cache.ageSeconds ? ` · ${cache.ageSeconds}s old` : ""}` : ""} · refreshes every 30 seconds
                </p>
            )}

            {summary.error ? <ErrorState error={summary.error} onRetry={reload} /> : (
                <div className="space-y-5">
                    {k && k.reads === 0 && (
                        <Alert tone="info" title="No reads recorded in this window yet">
                            Hourly numbers only exist from the moment tracking was switched on. Earlier hours stay empty.
                        </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        <StatCard label="Reads" value={k?.reads ?? 0} icon={Eye} tone="accent" change={k?.changePercent} loading={summary.isLoading} hint={s ? `vs ${s.window.comparedWith}` : undefined} />
                        <StatCard label="Readers" value={k?.readers ?? 0} icon={Users} tone="info" loading={summary.isLoading} hint="distinct visitors" />
                        <StatCard label="Reads this hour" value={k?.currentHourReads ?? 0} icon={Activity} tone="success" loading={summary.isLoading} hint="hour still in progress" />
                        <StatCard label="Avg reads / hour" value={k?.avgPerHour ?? 0} icon={Clock} tone="warning" loading={summary.isLoading}
                            hint={k?.peakHour ? `Peak ${k.peakHour.label} · ${num(k.peakHour.reads)}` : undefined} />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3">
                        <Block className="lg:col-span-2" title="Reads per hour" description={`${curName} vs ${prevName.toLowerCase()}`} loading={summary.isLoading} height="h-72"
                            info="Reads in each hour (IST). The faded line is the same hour one day earlier. Hours that have not happened yet are left empty. The current hour is still in progress, so its bar is lower than it will end up.">
                            <LinesChart data={chart} xKey="label" height={280}
                                series={[{ key: "current", name: curName }, { key: "previous", name: prevName, color: "var(--chart-2)" }]} />
                        </Block>
                        <Block title="By content type" description="Share of reads" loading={summary.isLoading}
                            info="How the reads in this window split between news, YouTube news, shorts and live news.">
                            {donut.length ? <Donut data={donut} height={240} /> : <EmptyState fill={false} title="No reads yet" />}
                        </Block>
                    </div>

                    <Card padded={false}>
                        <CardHeader title="Content" description="Stories and videos by reads in this window"
                            actions={<>
                                <Tabs variant="pill" value={sort} onChange={(v) => { setSort(v); setCPage(1); }} items={[{ value: "reads", label: "Top" }, { value: "rising", label: "Rising" }]} />
                                <InfoTip align="end">Top ranks by reads. Rising ranks by the biggest increase compared with the same hours a day earlier. Reads count any story, whenever it was published.</InfoTip>
                            </>} />
                        {content.error ? <ErrorState error={content.error} onRetry={content.refetch} /> : (
                            <>
                                <DataTable columns={contentCols} rows={cRows} loading={content.isLoading} rowKey="rowId" empty={<EmptyState title="No reads in this window" />} />
                                {Boolean(cData?.pagination?.total) && (
                                    <Pagination page={cPage} total={cData.pagination.total} limit={cLimit} onPage={setCPage} onLimit={(l) => { setCLimit(l); setCPage(1); }} limits={[10, 20, 50]} className="border-t border-line" />
                                )}
                            </>
                        )}
                    </Card>

                    <Card padded={false}>
                        <CardHeader title="Breakdown" description="Where the reads come from"
                            actions={<>
                                <Tabs variant="pill" value={dim} onChange={(v) => { setDim(v); setBPage(1); }} items={DIMENSIONS} />
                                <InfoTip align="end">{bData?.note || "Reads in this window grouped by category, state, reporter or content type."}</InfoTip>
                            </>} />
                        {breakdown.error ? <ErrorState error={breakdown.error} onRetry={breakdown.refetch} /> : (
                            <>
                                <DataTable columns={breakdownCols} rows={bRows} loading={breakdown.isLoading} rowKey="id" empty={<EmptyState title="No reads in this window" />} />
                                {Boolean(bData?.pagination?.total) && (
                                    <Pagination page={bPage} total={bData.pagination.total} limit={bLimit} onPage={setBPage} onLimit={(l) => { setBLimit(l); setBPage(1); }} limits={[10, 20, 50]} className="border-t border-line" />
                                )}
                            </>
                        )}
                    </Card>
                </div>
            )}
        </>
    );
}

/** Needs analytics.view, the same permission as the main dashboard. */
export default function LiveAnalytics() {
    const { can } = usePermission();
    return can("analytics.view")
        ? <Live />
        : <Card><EmptyState icon={Activity} title="You don't have access" description="Live analytics needs the analytics.view permission." /></Card>;
}