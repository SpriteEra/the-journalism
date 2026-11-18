import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, ExternalLink, Eye, FilterX, History, LayoutGrid, Link2, MessageCircle, MoreVertical, Newspaper, Pencil, Plus, RefreshCw, Rows3, ScanEye, SlidersHorizontal, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
import { fetchSingleNews, useFetchNews, useNewsAuthors } from "../../hooks/news";
import usePermission from "../../hooks/usePermission";
import { useApiMutation, useCategories, useDistricts, useStates } from "../../hooks/admin";
import { cn } from "../../lib/cn";
import { errMsg, fmtDate } from "../../lib/api";
import { siteUrl } from "../../lib/share";
import { handleImageError } from "../../utils/imageError";
import NewsFilter from "../NewsFilter";
import UpdateStackPanel from "../UpdateStack";
import NewsCard, { newsSitePath, statusOf } from "./NewsCard";
import NewsPreview from "./NewsPreview";
import { buttonStyles } from "../ui/Button";
import { Badge, Button, Card, DataTable, DateRangeFilter, EmptyState, ErrorState, Field, IconButton, Menu, MenuItem, MenuSeparator, PageHeader, Pagination, SearchInput, Select, Skeleton, useConfirm } from "../ui";

const EMPTY = { category: [], subCategory: [], district: "", state: "", location: "", createdAt: "", search: "", from: "", to: "", author: "" };
const countActive = (f) => ["category", "subCategory"].reduce((n, k) => n + (f[k]?.length ? 1 : 0), 0) + ["district", "state", "location", "createdAt", "from", "author"].filter((k) => f[k]).length;
const VIEW_KEY = "newsListLayout";

function Cover({ src, alt }) {
  return src
    ? <img src={src} alt={alt || ""} loading="lazy" onError={handleImageError} className="h-12 w-20 shrink-0 rounded-md bg-surface-3 object-cover" />
    : <span className="grid h-12 w-20 shrink-0 place-items-center rounded-md bg-surface-3 text-fg-faint"><Newspaper className="size-5" /></span>;
}

/**
 * One list for published news, drafts and the review queue.
 *  - Grid layout: NewsCard banner cards.
 *  - List layout: the same table as the Live news page (cover + title, status, by, time, views, actions).
 * Filters: search (title / place / category / topic / Hindi + English keywords), created by, date range, category, place.
 * Permissions: "Created by" needs news.view.all, edit = news.update.own / news.update.any, delete = news.delete.own / news.delete.any.
 */
export default function NewsList({ title, description, draft = false, needApproval = false, editQuery = "?mode=edit", editBase = "/dashboard/news/edit-news", emptyText = "No news here yet", showCreate = true }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { can, user } = usePermission();
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get("page") || "1", 10);
  const [limit, setLimit] = useState(12);
  const [applied, setApplied] = useState(EMPTY);
  const [selected, setSelected] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [stack, setStack] = useState(null);
  const [preview, setPreview] = useState(null);
  const [rejectedOnly, setRejectedOnly] = useState(false);
  const [layout, setLayout] = useState(() => { try { return localStorage.getItem(VIEW_KEY) || "grid"; } catch { return "grid"; } });

  const seeAll = can("news.view.all");
  const authors = useNewsAuthors(seeAll);
  const cats = useCategories(); const states = useStates(); const districts = useDistricts();
  const { data, isPending, isFetching, isError, error, refetch } = useFetchNews({ page, limit, draft, need_approval: needApproval, rejected: draft && rejectedOnly, filters: applied });

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);
  useEffect(() => { try { localStorage.setItem(VIEW_KEY, layout); } catch { /* ignore */ } }, [layout]);
  const go = (p) => setParams({ page: p });
  const apply = (f) => { setApplied(f); setSelected(f); go(1); };
  const active = countActive(applied) + (applied.search ? 1 : 0);

  const del = useApiMutation(
    (id) => httpClient.delete(`/delete-news/${id}`).then((r) => r.data),
    { invalidate: ["news", "trash"], success: "News deleted" }
  );
  const askDelete = async (n) => {
    if (await confirm({ title: t("Delete this story?"), message: `“${n.title}” moves to the trash.`, tone: "danger", confirmLabel: t("Delete") })) del.mutate(n.news_id);
  };

  const canDelete = (n) => can("news.delete.any") || (can("news.delete.own") && String(n.author?._id) === String(user?.id || user?._id) && (draft || can("news.publish")));
  const canEdit = can("news.update.any") || can("news.update.own");
  const isRejected = (n) => Boolean(n.rejected_at) && !n.need_approval;
  const editLabel = (n) => (needApproval ? t("Review") : isRejected(n) ? t("Fix & resubmit") : t("Edit"));
  const goEdit = (n) => navigate(`${editBase}/${n.news_id}${editQuery}`);

  // preview of a story from the list: the list has no body, so it is fetched on demand
  const openPreview = async (n) => {
    const id = toast.loading("Loading preview…");
    try {
      const full = await fetchSingleNews(n.news_id);
      const nm = (list, pick) => (list || []).map(pick).filter(Boolean);
      const a = full.author || {};

      setPreview({
        title: full.title, banner: full.banner, description: full.description, content: full.content, imageRef: full.imageRef, isVideo: full.isVideo, video: full.video,
        location: full.location, keywords: full.keywords, createdAt: full.post_time || full.createdAt,
        author: {
          name: a.fullName || a.username,
          role: a.designation,
          bio: a.about,
          image: a.profile,
        },
        categories: nm([...(full.category || []), ...(full.subCategory || [])], (c) => c.name), topics: nm(full.tags, (x) => x.title),
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
    (applied.category || []).forEach((id) => out.push([`c${id}`, name(cats.data, id, (c) => c.name) || "…", { category: applied.category.filter((x) => x !== id) }]));
    (applied.subCategory || []).forEach((id) => out.push([`s${id}`, name(cats.data, id, (c) => c.name) || "…", { subCategory: applied.subCategory.filter((x) => x !== id) }]));
    if (applied.state) out.push(["state", name(states.data, applied.state, (s) => s.displayName || s.state) || "…", { state: "", district: "" }]);
    if (applied.district) out.push(["district", name(districts.data, applied.district, (d) => d.displayName || d.district) || "…", { district: "" }]);
    if (applied.location) out.push(["loc", applied.location, { location: "" }]);
    if (applied.createdAt) out.push(["day", applied.createdAt, { createdAt: "" }]);
    return out;
  }, [applied, authors.data, cats.data, states.data, districts.data, t]);

  const writeBtn = showCreate && can("news.create") && <Link to="/dashboard/news/create" className={buttonStyles({})}><Plus className="size-4" />{t("Write news")}</Link>;
  const clearAll = () => { setSearch(""); apply(EMPTY); };

  const emptyState = (
    <EmptyState
      icon={Newspaper}
      title={draft && rejectedOnly ? t("No rejected stories") : t(emptyText)}
      description={active ? t("Try clearing the filters.") : undefined}
      action={!active ? writeBtn || null : <Button variant="outline" onClick={clearAll}>{t("Clear all")}</Button>}
    />
  );

  // ───────────── list layout: same table as Live news ─────────────
  // every row action lives in one three-dot menu
  const rowActions = (n) => {
    const url = siteUrl(newsSitePath(n));
    const onSite = !draft && !n.need_approval && n.isPublished !== false;
    return (
      <div className="flex justify-end">
        <Menu trigger={<IconButton label={t("More")} size="icon-sm"><MoreVertical className="size-4" /></IconButton>} width="w-52">
          {canEdit && <MenuItem icon={Pencil} onClick={() => goEdit(n)}>{editLabel(n)}</MenuItem>}
          <MenuItem icon={ScanEye} onClick={() => openPreview(n)}>{t("Preview")}</MenuItem>
          {n.update_stack && <MenuItem icon={History} onClick={() => setStack(n.update_stack)}>{t("History")}</MenuItem>}
          {isRejected(n) && <MenuItem icon={BadgeCheck} onClick={() => navigate(`/dashboard/review/news/${n.news_id}`)}>{t("View details & apply again")}</MenuItem>}
          {onSite && <MenuItem icon={ExternalLink} onClick={() => window.open(url, "_blank", "noopener")}>{t("View on website")}</MenuItem>}
          {!draft && (
            <>
              <MenuSeparator />
              <MenuItem icon={MessageCircle} as="a" href={`https://wa.me/?text=${encodeURIComponent(`*${n.title}*\n${url}`)}`} target="_blank" rel="noreferrer">WhatsApp</MenuItem>
              <MenuItem icon={Link2} onClick={() => navigator.clipboard?.writeText(url).then(() => toast.success("Link copied"))}>{t("Copy link")}</MenuItem>
            </>
          )}
          {canDelete(n) && (
            <>
              <MenuSeparator />
              <MenuItem icon={Trash2} tone="danger" onClick={() => askDelete(n)}>{t("Delete")}</MenuItem>
            </>
          )}
        </Menu>
      </div>
    );
  };

  const columns = [
    {
      key: "title", header: t("News"), primary: true, cell: (n) => (
        <div className="flex min-w-0 items-center gap-3">
          <Cover src={n.banner ? `${n.banner}?q=75&w=240` : ""} alt={n.title} />
          <Link to={`/dashboard/news/${n.news_id}`} className="hindi-font line-clamp-2 max-w-sm font-medium text-fg hover:text-primary lg:text-base">{n.title}</Link>
        </div>
      ),
    },
    {
      key: "status", header: t("Status"), cell: (n) => {
        const st = statusOf(n, draft);
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge tone={st.tone} dot size="sm">{t(st.label)}</Badge>
            {isRejected(n) && n.rejected_by?.username && <span className="text-xs text-fg-subtle">{t("by")} {n.rejected_by.username}</span>}
          </div>
        );
      },
    },
    { key: "by", header: t("By"), cell: (n) => n.author?.fullName || n.author?.username || "—" },
    { key: "when", header: t("Time"), cell: (n) => <span className="text-xs"><span className="text-fg-subtle">{t("Created")}</span><br />{fmtDate(n.createdAt, true)}</span> },
    ...(!draft ? [{ key: "views", header: t("Views"), align: "right", cell: (n) => <span className="inline-flex items-center gap-1 text-fg-muted"><Eye className="size-3.5" />{(n.activity?.total_reads || 0).toLocaleString("en-IN")}</span> }] : []),
    { key: "actions", header: t("Actions"), align: "right", cell: rowActions },
  ];

  // phones keep the compact NewsCard row (the layout switch is hidden below sm)
  const mobileCard = (n) => (
    <NewsCard
      item={n}
      layout="list"
      draft={draft}
      needApproval={needApproval}
      canEdit={canEdit}
      canDelete={canDelete(n)}
      onEdit={() => goEdit(n)}
      onPreview={() => openPreview(n)}
      onHistory={() => setStack(n.update_stack)}
      onDelete={() => askDelete(n)}
    />
  );

  let body;
  if (isError) {
    body = <Card><ErrorState error={error} onRetry={refetch} /></Card>;
  } else if (layout === "list") {
    body = (
      <Card padded={false} className={cn("overflow-hidden transition-opacity", isFetching && !isPending && "opacity-70")}>
        <DataTable
          contained
          breakpoint="sm"
          columns={columns}
          rows={data?.news}
          loading={isPending}
          mobileCard={mobileCard}
          empty={emptyState}
        />
      </Card>
    );
  } else if (isPending) {
    body = (
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="surface-card space-y-3 p-4"><Skeleton className="aspect-video w-full" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>)}
      </div>
    );
  } else if (!data?.news?.length) {
    body = <Card className="flex min-h-[max(20rem,calc(100dvh-26rem))] items-center">{emptyState}</Card>;
  } else {
    body = (
      <div className={cn("grid h-full flex-1 gap-4 transition-opacity sm:grid-cols-2 2xl:grid-cols-3", isFetching && "opacity-70")}>
        {data.news.map((n) => (
          <NewsCard
            key={n.news_id}
            item={n}
            layout="grid"
            draft={draft}
            needApproval={needApproval}
            canEdit={canEdit}
            canDelete={canDelete(n)}
            onEdit={() => goEdit(n)}
            onPreview={() => openPreview(n)}
            onHistory={() => setStack(n.update_stack)}
            onDelete={() => askDelete(n)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} aria-label={t("Reload")} title={t("Reload")} className="!px-2.5">
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
            {writeBtn}
          </div>
        }
      />

      <Card padded={false} className="mb-2 overflow-visible rounded-lg">
        <div className="flex items-center gap-1.5 p-1 sm:p-2.5">
          <form
            className="min-w-0 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              apply({ ...applied, search });
            }}>
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                if (!v && applied.search) apply({ ...applied, search: "" });
              }}
              placeholder={t("Search title, place, category or keyword (Enter)")}
            />
          </form>
          <div className="flex items-center gap-1 sm:gap-2">
            {draft && (
              <Button variant={rejectedOnly ? "primary" : "outline"} onClick={() => { setRejectedOnly((v) => !v); go(1); }} className="px-2 sm:flex-none">
                {t("Rejected")}
              </Button>
            )}
            <Button
              variant="outline"
              leftIcon={SlidersHorizontal}
              onClick={() => { setSelected(applied); setFilterOpen(true); }} className="flex-1 px-2 sm:flex-none"
            >
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
              <button
                key={key}
                type="button"
                onClick={() => apply({ ...applied, ...patch })}
                className="group inline-flex max-w-full items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-fg-muted hover:bg-danger-soft hover:text-danger"
              >
                <span className="truncate">{text}</span>
                <span aria-hidden className="text-fg-faint group-hover:text-danger">×</span>
              </button>
            ))}
            {applied.search && (
              <button
                type="button"
                onClick={() => { setSearch(""); apply({ ...applied, search: "" }); }}
                className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-fg-muted hover:bg-danger-soft hover:text-danger"
              >
                “{applied.search}” ×
              </button>
            )}
            <Button variant="ghost" size="xs" leftIcon={FilterX} className="ml-auto" onClick={clearAll}>
              {t("Clear all")}
            </Button>
          </div>
        )}
      </Card>

      {body}

      {Boolean(data?.total) && <Card padded={false} className="mt-4"><Pagination page={page} total={data.total} limit={limit} onPage={go} onLimit={(l) => { setLimit(l); go(1); }} limits={[12, 24, 48]} /></Card>}

      <NewsFilter isOpen={filterOpen} onClose={() => setFilterOpen(false)} selectedOptions={selected} setSelectedOptions={setSelected} handleSubmit={() => apply({ ...selected, search })}>
        {seeAll && (
          <Field label={t("Created by")} info="Show only the stories written by one person.">
            <Select value={selected.author} onChange={(e) => setSelected((p) => ({ ...p, author: e.target.value }))}
              options={[{ value: "", label: t("Everyone") }, ...(authors.data || []).map((a) => ({ value: a._id, label: `${a.fullName || a.username} (${a.total})` }))]} />
          </Field>
        )}
        <Field label={t("Date range")} info="Stories written between these two dates (both days included).">
          <DateRangeFilter value={{ from: selected.from, to: selected.to }} onChange={({ from, to }) => setSelected((p) => ({ ...p, from, to }))} className="w-full" />
        </Field>
      </NewsFilter>
      <UpdateStackPanel isOpen={Boolean(stack)} onClose={() => setStack(null)} stack_id={stack} />
      <NewsPreview open={Boolean(preview)} onClose={() => setPreview(null)} news={preview} />
    </div>
  );
}