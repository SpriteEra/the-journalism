import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FilterX, LayoutGrid, Newspaper, Plus, Rows3, SlidersHorizontal, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
import { fetchSingleNews, useFetchNews, useNewsAuthors } from "../../hooks/news";
import usePermission from "../../hooks/usePermission";
import { useApiMutation, useCategories, useDistricts, useStates } from "../../hooks/admin";
import { cn } from "../../lib/cn";
import { errMsg } from "../../lib/api";
import NewsFilter from "../NewsFilter";
import UpdateStackPanel from "../UpdateStack";
import NewsCard from "./NewsCard";
import NewsPreview from "./NewsPreview";
import { buttonStyles } from "../ui/Button";
import { Badge, Button, Card, DateRangeFilter, EmptyState, ErrorState, Field, PageHeader, Pagination, SearchInput, Select, Skeleton, useConfirm } from "../ui";

const EMPTY = { category: [], subCategory: [], district: "", state: "", location: "", createdAt: "", search: "", from: "", to: "", author: "" };
const countActive = (f) => ["category", "subCategory"].reduce((n, k) => n + (f[k]?.length ? 1 : 0), 0) + ["district", "state", "location", "createdAt", "from", "author"].filter((k) => f[k]).length;
const VIEW_KEY = "newsListLayout";

/**
 * One list for published news, drafts and the review queue.
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
  const [layout, setLayout] = useState(() => { try { return localStorage.getItem(VIEW_KEY) || "grid"; } catch { return "grid"; } });

  const seeAll = can("news.view.all");
  const authors = useNewsAuthors(seeAll);
  const cats = useCategories(); const states = useStates(); const districts = useDistricts();
  const { data, isPending, isFetching, isError, error, refetch } = useFetchNews({ page, limit, draft, need_approval: needApproval, filters: applied });

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);
  useEffect(() => { try { localStorage.setItem(VIEW_KEY, layout); } catch { /* ignore */ } }, [layout]);
  const go = (p) => setParams({ page: p });
  const apply = (f) => { setApplied(f); setSelected(f); go(1); };
  const active = countActive(applied) + (applied.search ? 1 : 0);

  const del = useApiMutation((id) => httpClient.delete(`/delete-news/${id}`).then((r) => r.data), { invalidate: ["news"], success: "News deleted" });
  const askDelete = async (n) => {
    if (await confirm({ title: t("Delete this story?"), message: `“${n.title}” moves to the trash.`, tone: "danger", confirmLabel: t("Delete") })) del.mutate(n.news_id);
  };

  const canDelete = (n) => can("news.delete.any") || (can("news.delete.own") && String(n.author?._id) === String(user?.id || user?._id) && (draft || can("news.publish")));
  const canEdit = can("news.update.any") || can("news.update.own");

  // preview of a story from the list: the list has no body, so it is fetched on demand
  const openPreview = async (n) => {
    const id = toast.loading("Loading preview…");
    try {
      const full = await fetchSingleNews(n.news_id);
      console.log(full)
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
    (applied.category || []).forEach((id) => out.push([`c${id}`, name(cats.data, id, (c) => c.name) || "…", { category: applied.category.filter((x) => x !== id), subCategory: [] }]));
    (applied.subCategory || []).forEach((id) => out.push([`s${id}`, name(cats.data, id, (c) => c.name) || "…", { subCategory: applied.subCategory.filter((x) => x !== id) }]));
    if (applied.state) out.push(["state", name(states.data, applied.state, (s) => s.displayName || s.state) || "…", { state: "", district: "" }]);
    if (applied.district) out.push(["district", name(districts.data, applied.district, (d) => d.displayName || d.district) || "…", { district: "" }]);
    if (applied.location) out.push(["loc", applied.location, { location: "" }]);
    if (applied.createdAt) out.push(["day", applied.createdAt, { createdAt: "" }]);
    return out;
  }, [applied, authors.data, cats.data, states.data, districts.data, t]);

  const noun = draft ? "drafts" : "stories";
  const writeBtn = showCreate && can("news.create") && <Link to="/dashboard/news/create" className={buttonStyles({})}><Plus className="size-4" />{t("Write news")}</Link>;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={title} description={description} actions={writeBtn} />

      <Card padded={false} className="mb-2 overflow-visible rounded-lg">
        <div className="flex gap-1.5 p-1 items-center sm:p-2.5">
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
                if (!v && applied.search)
                  apply({ ...applied, search: "" });
              }}
              placeholder={t("Search title, place, category or keyword (Enter)")}
            />
          </form>
          <div className="flex items-center gap-1 sm:gap-2">

            <Button
              variant="outline"
              leftIcon={SlidersHorizontal}
              onClick={() => { setSelected(applied); setFilterOpen(true); }} className="px-2 flex-1 sm:flex-none"
            >
              {t("Filters")}{active - (applied.search ? 1 : 0) > 0 && <span className="ml-1 grid size-4 sm:size-5 place-items-center rounded-full bg-fg text-[11px] font-semibold text-canvas">{active - (applied.search ? 1 : 0)}</span>}
            </Button>

            <div className="hidden sm:flex items-center rounded-control border border-line-strong p-0.5" role="group" aria-label="Layout">
              {[["grid", LayoutGrid, t("Grid")], ["list", Rows3, t("List")]].map(([id, Icon, label]) => (
                <button key={id} type="button" aria-pressed={layout === id} aria-label={label} title={label} onClick={() => setLayout(id)}
                  className={cn("grid size-7 sm:size-9 place-items-center rounded-md sm:rounded-lg transition-colors", layout === id ? "bg-primary text-primary-fg" : "text-fg-subtle hover:bg-surface-2")}><Icon className="size-3.5 sm:size-4" /></button>
              ))}
            </div>
          </div>
        </div>

        {/* <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2.5 sm:px-4">
          <Badge tone="primary">{(data?.total ?? 0).toLocaleString("en-IN")} {t(noun)}</Badge>
          {chips.length && chips.map(([key, text, patch]) => (
            <button key={key} type="button" onClick={() => apply({ ...applied, ...patch })} className="group inline-flex max-w-full items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-fg-muted hover:bg-danger-soft hover:text-danger">
              <span className="truncate">{text}</span><span aria-hidden className="text-fg-faint group-hover:text-danger">×</span>
            </button>
          ))}
          {applied.search && <button type="button" onClick={() => { setSearch(""); apply({ ...applied, search: "" }); }} className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-fg-muted hover:bg-danger-soft hover:text-danger">“{applied.search}” ×</button>}
          {active > 0 && <Button variant="ghost" size="xs" leftIcon={FilterX} className="ml-auto" onClick={() => { setSearch(""); apply(EMPTY); }}>{t("Clear all")}</Button>}
        </div> */}

        {active > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2 sm:px-3">
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
            <Button
              variant="ghost"
              size="xs"
              leftIcon={FilterX}
              className="ml-auto"
              onClick={() => { setSearch(""); apply(EMPTY); }}
            >
              {t("Clear all")}
            </Button>
          </div>
        )}
      </Card>

      {isError
        ?
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card> :
        isPending ? (
          <div className={cn("grid gap-4", layout === "grid" ? "sm:grid-cols-2 2xl:grid-cols-3" : "")}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="surface-card space-y-3 p-4"><Skeleton className="aspect-video w-full" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>)}
          </div>
        ) : !data?.news?.length ? (
          <Card className="flex min-h-[max(20rem,calc(100dvh-26rem))] items-center">
            <EmptyState
              icon={Newspaper}
              title={t(emptyText)}
              description={active ? t("Try clearing the filters.") : undefined} action={!active ? writeBtn || null : <Button variant="outline" onClick={() => { setSearch(""); apply(EMPTY); }}>{t("Clear all")}</Button>}
            />
          </Card>
        ) : (
          <div className={cn("grid gap-4 transition-opacity h-full flex-1", layout === "grid" ? "sm:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1", isFetching && "opacity-70")}>
            {data.news.map((n) => (
              <NewsCard
                key={n.news_id}
                item={n}
                layout={layout}
                draft={draft}
                needApproval={needApproval}
                canEdit={canEdit}
                canDelete={canDelete(n)}
                onEdit={() =>
                  navigate(`${editBase}/${n.news_id}${editQuery}`)}
                onPreview={() => openPreview(n)}
                onHistory={() => setStack(n.update_stack)}
                onDelete={() => askDelete(n)}
              />
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
        <Field label={t("Date range")} info="Stories written between these two dates (both days included).">
          <DateRangeFilter value={{ from: selected.from, to: selected.to }} onChange={({ from, to }) => setSelected((p) => ({ ...p, from, to }))} className="w-full" />
        </Field>
      </NewsFilter>
      <UpdateStackPanel isOpen={Boolean(stack)} onClose={() => setStack(null)} stack_id={stack} />
      <NewsPreview open={Boolean(preview)} onClose={() => setPreview(null)} news={preview} />
    </div>
  );
}
