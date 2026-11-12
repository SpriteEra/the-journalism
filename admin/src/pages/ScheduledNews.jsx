import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CalendarClock, FilterX, LayoutGrid, MoreVertical, Pencil, Plus, RefreshCw, Rows3, ScanEye, Send, SlidersHorizontal, Trash2, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import httpClient from "../api/httpClient";
import { fetchScheduledNews, useFetchScheduleNews, useNewsAuthors } from "../hooks/news";
import { useCategories, useDistricts, useStates } from "../hooks/admin";
import usePermission from "../hooks/usePermission";
import { cn } from "../lib/cn";
import { errMsg } from "../lib/api";
import { handleImageError } from "../utils/imageError";
import NewsFilter from "../components/NewsFilter";
import NewsPreview from "../components/news/NewsPreview";
import { buttonStyles } from "../components/ui/Button";
import { Avatar, Badge, Button, Card, DateRangeFilter, EmptyState, ErrorState, Field, IconButton, Menu, MenuItem, MenuSeparator, PageHeader, Pagination, SearchInput, Select, Skeleton, useConfirm } from "../components/ui";

const EMPTY = { category: [], subCategory: [], district: "", state: "", location: "", search: "", from: "", to: "", author: "" };
const countActive = (f) => ["category", "subCategory"].reduce((n, k) => n + (f[k]?.length ? 1 : 0), 0) + ["district", "state", "location", "from", "author"].filter((k) => f[k]).length;
const VIEW_KEY = "newsListLayout";

// exact publish moment in IST, with the old { date, time } as a fallback for stories not yet backfilled
const fmtWhen = (n) => n.publishAt
  ? new Date(n.publishAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
  : [n.post_time?.date, n.post_time?.time].filter(Boolean).join(", ");

const fmtIn = (iso) => {
  if (!iso) return null;
  const m = Math.round((new Date(iso) - Date.now()) / 60000);
  if (m <= 0) return "Publishing shortly";
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h}h ${m % 60}m`;
  return `in ${Math.floor(h / 24)}d ${h % 24}h`;
};

/** One scheduled story, same design as NewsCard (list = compact row, grid = banner card). */
function ScheduledCard({ item: n, layout = "grid", canEdit, canPublish, canDelete, onEdit, onPreview, onPublish, onDelete }) {
  const { t } = useTranslation();
  const grid = layout === "grid";
  const authorName = n.author?.fullName || n.author?.username;
  const left = fmtIn(n.publishAt);

  const statusBadge = <Badge tone="warning" dot size="sm" className="absolute left-2.5 top-2.5 shadow-sm ring-1 ring-black/5">{t("Scheduled")}</Badge>;
  const videoBadge = n.isVideo && <Badge tone="neutral" size="sm" className="absolute right-2.5 top-2.5 bg-ink/80 text-paper"><Video className="size-3" />Video</Badge>;

  const title = (
    <button type="button" onClick={onPreview} className="hindi-font line-clamp-2 text-left text-lg font-semibold text-fg hover:text-primary lg:leading-snug max-sm:pt-0.5">
      {n.title}
    </button>
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-subtle">
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <Avatar name={authorName} src={n.author?.profile} size="xs" />
        <span className="truncate font-medium text-fg-muted">{authorName}</span>
      </span>
      <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" />{fmtWhen(n)}</span>
      {left && <Badge tone="info" size="sm">{left}</Badge>}
      {n.sendNotification && <Badge tone="neutral" size="sm">{t("Push")}</Badge>}
    </div>
  );

  const menu = (canPublish || canDelete) && (
    <Menu trigger={<IconButton label="More" size="icon-sm"><MoreVertical className="size-4" /></IconButton>} width="w-44">
      {canPublish && <MenuItem icon={Send} onClick={onPublish}>{t("Publish now")}</MenuItem>}
      {canPublish && canDelete && <MenuSeparator />}
      {canDelete && <MenuItem icon={Trash2} tone="danger" onClick={onDelete}>{t("Delete")}</MenuItem>}
    </Menu>
  );

  // ───────────── list: compact row ─────────────
  if (!grid) {
    return (
      <article className="surface-card group flex h-fit flex-col gap-3 overflow-hidden p-1 transition-shadow hover:shadow-pop sm:flex-row sm:p-2">
        <button type="button" onClick={onPreview} aria-label={n.title} className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-md bg-surface-3 sm:aspect-auto sm:w-52 sm:self-stretch">
          {n.banner && <img src={`${n.banner}?q=75&w=480`} alt="" loading="lazy" onError={handleImageError} className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
          {statusBadge}{videoBadge}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-2 px-1 py-1.5 sm:py-2">
          {title}
          {meta}
        </div>

        <div className="flex items-center gap-1.5 border-t border-line px-1 pt-2 sm:flex-col sm:justify-center sm:gap-1 sm:border-l sm:border-t-0 sm:px-2 sm:pt-0">
          {menu}
          {canEdit && (
            <>
              <Button size="sm" variant="soft" leftIcon={Pencil} onClick={onEdit} className="flex-1 sm:hidden">{t("Edit")}</Button>
              <IconButton label={t("Edit")} title={t("Edit")} size="icon-sm" variant="soft" onClick={onEdit} className="hidden sm:inline-grid"><Pencil className="size-4" /></IconButton>
            </>
          )}
          <IconButton label={t("Preview")} title={t("Preview")} size="icon-sm" onClick={onPreview}><ScanEye className="size-4" /></IconButton>
        </div>
      </article>
    );
  }

  // ───────────── grid: banner card ─────────────
  return (
    <article className="surface-card group flex h-fit flex-col overflow-hidden transition-shadow hover:shadow-pop">
      <button type="button" onClick={onPreview} aria-label={n.title} className="relative block aspect-video w-full shrink-0 overflow-hidden bg-surface-3">
        {n.banner && <img src={`${n.banner}?q=75&w=480`} alt="" loading="lazy" onError={handleImageError} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        {statusBadge}{videoBadge}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-2 sm:gap-2 sm:p-4">
        {title}
        <div className="mt-auto sm:pt-1">{meta}</div>
        <div className="mt-1 flex items-center gap-1 border-t border-line pt-1.5 sm:mt-2 sm:gap-1.5 sm:pt-3">
          {canEdit && <Button className="max-sm:rounded" size="sm" variant="soft" leftIcon={Pencil} onClick={onEdit}>{t("Edit")}</Button>}
          <span className="ml-auto flex items-center">{menu}</span>
          <Button size="sm" variant="ghost" leftIcon={ScanEye} onClick={onPreview}>{t("Preview")}</Button>
        </div>
      </div>
    </article>
  );
}

/** Stories waiting for their publish time. Same layout as the News list. */
export default function ScheduledNews() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const { can, user } = usePermission();
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get("page") || "1", 10);
  const [limit, setLimit] = useState(12);
  const [applied, setApplied] = useState(EMPTY);
  const [selected, setSelected] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [layout, setLayout] = useState(() => { try { return localStorage.getItem(VIEW_KEY) || "grid"; } catch { return "grid"; } });
  const [, tick] = useState(0);

  const seeAll = can("news.view.all");
  const authors = useNewsAuthors(seeAll);
  const cats = useCategories(); const states = useStates(); const districts = useDistricts();
  const { data, isPending, isFetching, isError, error, refetch } = useFetchScheduleNews({ page, limit, filters: applied });

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);
  useEffect(() => { try { localStorage.setItem(VIEW_KEY, layout); } catch { /* ignore */ } }, [layout]);
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 60_000); return () => clearInterval(id); }, []);   // keeps "in 3h 10m" fresh

  const go = (p) => setParams({ page: p });
  const apply = (f) => { setApplied(f); setSelected(f); go(1); };
  const active = countActive(applied) + (applied.search ? 1 : 0);

  const done = () => { qc.invalidateQueries({ queryKey: ["schedule-news"] }); qc.invalidateQueries({ queryKey: ["news"] }); };
  const act = async (label, fn, ok) => { const id = toast.loading(`${label}…`); try { await fn(); toast.success(ok, { id }); done(); } catch (e) { toast.error(errMsg(e, `${label} failed`), { id }); } };

  const publish = async (n) => { if (await confirm({ title: "Publish now?", message: `“${n.title}” goes live immediately instead of at its scheduled time.`, confirmLabel: "Publish now" })) act("Publishing", () => httpClient.put("publish-scheduled-news", { news_id: n.news_id }), "News published"); };
  const remove = async (n) => { if (await confirm({ title: "Delete this scheduled story?", message: `“${n.title}” will not be published. This cannot be undone.`, tone: "danger", confirmLabel: "Delete" })) act("Deleting", () => httpClient.delete(`/delete-scheduled-news/${n.news_id}`), "Scheduled news deleted"); };

  const canEdit = can("news.update.any") || can("news.update.own");
  const canDelete = (n) => can("news.delete.any") || (can("news.delete.own") && String(n.author?._id) === String(user?.id || user?._id));

  // the list has no body, so the full story is fetched when Preview is pressed
  const openPreview = async (n) => {
    const id = toast.loading("Loading preview…");
    try {
      const full = await fetchScheduledNews(n.news_id, { preview: true });
      const nm = (list, pick) => (list || []).map(pick).filter(Boolean);
      const a = full.author || {};
      setPreview({
        title: full.title, banner: full.banner, description: full.description, content: full.content, imageRef: full.imageRef,
        isVideo: full.isVideo, video: full.video, location: full.location, keywords: full.keywords,
        createdAt: full.publishAt || n.publishAt || full.createdAt,
        author: { name: a.fullName || a.username, role: a.designation, bio: a.about, image: a.profile },
        categories: nm([...(full.category || []), ...(full.subCategory || [])], (c) => c.name),
        topics: nm(full.tags, (x) => x.title),
        places: nm([...(full.state || []), ...(full.district || [])], (p) => p.displayName || p.state || p.district),
      });
      toast.dismiss(id);
    } catch (e) { toast.error(errMsg(e, "Could not load the preview"), { id }); }
  };

  // active filter chips (each removable)
  const chips = useMemo(() => {
    const name = (list, id, pick) => pick((list || []).find((x) => x._id === id) || {});
    const out = [];
    if (applied.author) out.push(["author", `${t("Created by")}: ${(authors.data || []).find((a) => a._id === applied.author)?.username || "…"}`, { author: "" }]);
    if (applied.from || applied.to) out.push(["range", `${applied.from || "…"} → ${applied.to || "…"}`, { from: "", to: "" }]);
    (applied.category || []).forEach((id) => out.push([`c${id}`, name(cats.data, id, (c) => c.name) || "…", { category: applied.category.filter((x) => x !== id), subCategory: [] }]));
    (applied.subCategory || []).forEach((id) => out.push([`s${id}`, name(cats.data, id, (c) => c.name) || "…", { subCategory: applied.subCategory.filter((x) => x !== id) }]));
    if (applied.state) out.push(["state", name(states.data, applied.state, (s) => s.displayName || s.state) || "…", { state: "", district: "" }]);
    if (applied.district) out.push(["district", name(districts.data, applied.district, (d) => d.displayName || d.district) || "…", { district: "" }]);
    if (applied.location) out.push(["loc", applied.location, { location: "" }]);
    return out;
  }, [applied, authors.data, cats.data, states.data, districts.data, t]);

  const writeBtn = can("news.create") && <Link to="/dashboard/news/create" className={buttonStyles({})}><Plus className="size-4" />{t("Write news")}</Link>;

  // reload sits just left of "Write news"
  const reloadBtn = (
    <Button variant="outline" onClick={() => refetch()} disabled={isFetching} aria-label={t("Reload")} title={t("Reload")} className="!px-2.5">
      <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
    </Button>
  );

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Scheduled news"
        description="Stories that will be published automatically at the time you set."
        actions={<div className="flex items-center gap-2">{reloadBtn}{writeBtn}</div>}
      />

      <Card padded={false} className="mb-2 overflow-visible rounded-lg">
        <div className="flex items-center gap-1.5 p-1 sm:p-2.5">
          <form className="min-w-0 flex-1" onSubmit={(e) => { e.preventDefault(); apply({ ...applied, search }); }}>
            <SearchInput value={search} onChange={(v) => { setSearch(v); if (!v && applied.search) apply({ ...applied, search: "" }); }} placeholder={t("Search title or keyword (Enter)")} />
          </form>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" leftIcon={SlidersHorizontal} onClick={() => { setSelected(applied); setFilterOpen(true); }} className="flex-1 px-2 sm:flex-none">
              {t("Filters")}{active - (applied.search ? 1 : 0) > 0 && <span className="ml-1 grid size-4 place-items-center rounded-full bg-fg text-[11px] font-semibold text-canvas sm:size-5">{active - (applied.search ? 1 : 0)}</span>}
            </Button>
            <div className="hidden items-center rounded-control border border-line-strong p-0.5 sm:flex" role="group" aria-label="Layout">
              {[["grid", LayoutGrid, t("Grid")], ["list", Rows3, t("List")]].map(([id, Icon, label]) => (
                <button key={id} type="button" aria-pressed={layout === id} aria-label={label} title={label} onClick={() => setLayout(id)}
                  className={cn("grid size-7 place-items-center rounded-md transition-colors sm:size-9 sm:rounded-lg", layout === id ? "bg-primary text-primary-fg" : "text-fg-subtle hover:bg-surface-2")}><Icon className="size-3.5 sm:size-4" /></button>
              ))}
            </div>
          </div>
        </div>

        {active > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2">
            {chips.map(([key, text, patch]) => (
              <button key={key} type="button" onClick={() => apply({ ...applied, ...patch })} className="group inline-flex max-w-full items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-fg-muted hover:bg-danger-soft hover:text-danger">
                <span className="truncate">{text}</span><span aria-hidden className="text-fg-faint group-hover:text-danger">×</span>
              </button>
            ))}
            {applied.search && <button type="button" onClick={() => { setSearch(""); apply({ ...applied, search: "" }); }} className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-fg-muted hover:bg-danger-soft hover:text-danger">“{applied.search}” ×</button>}
            <Button variant="ghost" size="xs" leftIcon={FilterX} className="ml-auto" onClick={() => { setSearch(""); apply(EMPTY); }}>{t("Clear all")}</Button>
          </div>
        )}
      </Card>

      {isError ? <Card><ErrorState error={error} onRetry={refetch} /></Card> : isPending ? (
        <div className={cn("grid gap-4", layout === "grid" ? "sm:grid-cols-2 2xl:grid-cols-3" : "")}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="surface-card space-y-3 p-4"><Skeleton className="aspect-video w-full" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>)}
        </div>
      ) : !data?.news?.length ? (
        <Card className="flex min-h-[max(20rem,calc(100dvh-26rem))] items-center">
          <EmptyState icon={CalendarClock} title={t("Nothing is scheduled")} description={active ? t("Try clearing the filters.") : "Use “Schedule” on the publish step to queue a story for later."}
            action={active ? <Button variant="outline" onClick={() => { setSearch(""); apply(EMPTY); }}>{t("Clear all")}</Button> : writeBtn || null} />
        </Card>
      ) : (
        <div className={cn("grid h-full flex-1 gap-4 transition-opacity", layout === "grid" ? "sm:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1", isFetching && "opacity-70")}>
          {data.news.map((n) => (
            <ScheduledCard key={n.news_id} item={n} layout={layout}
              canEdit={canEdit} canPublish={can("news.publish")} canDelete={canDelete(n)}
              onEdit={() => navigate(`/dashboard/news/edit-news/${n.news_id}?type=schedule_news&mode=edit`)}
              onPreview={() => openPreview(n)} onPublish={() => publish(n)} onDelete={() => remove(n)} />
          ))}
        </div>
      )}

      {Boolean(data?.total) && <Card padded={false} className="mt-4"><Pagination page={page} total={data.total} limit={limit} onPage={go} onLimit={(l) => { setLimit(l); go(1); }} limits={[12, 24, 48]} /></Card>}

      <NewsFilter isOpen={filterOpen} onClose={() => setFilterOpen(false)} selectedOptions={selected} setSelectedOptions={setSelected} handleSubmit={() => apply({ ...selected, search })}>
        {seeAll && (
          <Field label={t("Created by")} info="Show only the stories written by one person.">
            <Select value={selected.author} onChange={(e) => setSelected((p) => ({ ...p, author: e.target.value }))}
              options={[{ value: "", label: t("Everyone") }, ...(authors.data || []).map((a) => ({ value: a._id, label: `${a.fullName || a.username} (${a.total})` }))]} />
          </Field>
        )}
        <Field label={t("Scheduled between")} info="Stories set to go live between these two dates (both days included).">
          <DateRangeFilter value={{ from: selected.from, to: selected.to }} onChange={({ from, to }) => setSelected((p) => ({ ...p, from, to }))} className="w-full" />
        </Field>
      </NewsFilter>
      <NewsPreview open={Boolean(preview)} onClose={() => setPreview(null)} news={preview} />
    </div>
  );
}