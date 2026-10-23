import { useId, useState } from "react";
import { ChevronsDown, GitMerge, Newspaper, Pencil, Plus, Star, Tags as TagsIcon, Trash2 } from "lucide-react";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import { useApiMutation, useTagSuggest, useTags } from "../../hooks/admin";
import { fmtDate } from "../../lib/api";
import {
  Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, IconButton, Modal, PageHeader, Pagination,
  SearchInput, Select, StatusBadge, Tabs,
} from "../../components/ui";
import TagFormModal from "./TagFormModal";

/** Space taken above/below the page content (top bar + page padding). Tweak if the card ends too high or scrolls the page. */
const PAGE_OFFSET = "7.5rem";

/** News that use this topic. Falls back through likely field names so the number always shows. */
const usedCount = (t) => t.newsCount ?? t.usedCount ?? t.count ?? 0;
/** Who created the topic (adjust to the field your API returns). */
const creatorOf = (t) => t.createdBy?.username || t.createdBy?.name || t.author?.username || t.author?.name || null;

const cardBtn = "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg-muted transition-colors active:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

function MergeDialog({ tag, onClose }) {
  const [q, setQ] = useState("");
  const [target, setTarget] = useState(null);
  const { data: options = [] } = useTagSuggest(q);
  const merge = useApiMutation(() => httpClient.post(`/tags/${tag._id}/merge`, { targetId: target.id }).then((r) => r.data), { invalidate: ["tags", "tag-suggest"], onSuccess: onClose });
  return (
    <Modal open onClose={onClose} size="md" title={`Merge “${tag.title}”`} description="All news move to the topic you pick. The old title becomes an alias and the old link keeps working."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => merge.mutate()} disabled={!target} loading={merge.isPending}>Merge tags</Button></>}>
      <div className="space-y-3">
        <SearchInput value={q} onChange={setQ} placeholder="Find the topic to keep…" autoFocus />
        <ul className="max-h-60 divide-y divide-line overflow-auto rounded-xl border border-line">
          {options.filter((o) => o.id !== tag._id).map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => setTarget(o)} className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-surface-2 ${target?.id === o.id ? "bg-primary-soft text-primary" : "text-fg-muted"}`}>
                <span>#{o.title}</span>{target?.id === o.id && <Badge tone="primary" size="sm">Keep this</Badge>}
              </button>
            </li>
          ))}
          {!options.length && <li className="px-3 py-6 text-center text-sm text-fg-subtle">No topics found</li>}
        </ul>
      </div>
    </Modal>
  );
}

const ALIAS_PREVIEW = 5;

/** Alias chips: first few shown, the rest behind a "+N more" toggle; long lists scroll instead of growing the card. */
function AliasList({ aliases = [] }) {
  const [all, setAll] = useState(false);
  const shown = all ? aliases : aliases.slice(0, ALIAS_PREVIEW);
  const hidden = aliases.length - ALIAS_PREVIEW;

  return (
    <div>
      <p className="mb-1.5 text-xs text-fg-subtle">Aliases ({aliases.length})</p>
      <ul className={`flex flex-wrap gap-1.5 ${all ? "max-h-32 overflow-y-auto pr-1" : ""}`}>
        {shown.map((a) => (
          <li key={a} className="max-w-full break-words rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-fg-muted">{a}</li>
        ))}
        {hidden > 0 && (
          <li>
            <button
              type="button"
              onClick={() => setAll((v) => !v)}
              className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {all ? "Show less" : `+${hidden} more`}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

function TagCard({ tag: t, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="group flex w-full items-start gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-semibold text-fg">
            <span className="truncate">#{t.title}</span>
            {t.isFeatured && <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Featured" />}
          </p>
          <p className="truncate text-xs text-fg-subtle">/{t.slug}</p>
          <span className="mt-1 flex items-center gap-1 text-[10px] italic text-red-500 transition-colors group-hover:text-fg">
            {open ? "Hide details" : "View details"}
            <ChevronsDown className={`size-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={t.isActive ? "active" : "inactive"} />
          <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
            <Newspaper className="size-3.5" aria-hidden />
            <span className="font-medium tabular-nums text-fg">{usedCount(t)}</span> news
          </span>
        </div>
      </button>

      <div id={id} className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden" inert={open ? undefined : ""}>
          <div className="space-y-3 border-t border-line p-3">
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-fg-subtle">News using this topic</dt>
                <dd className="font-semibold tabular-nums text-fg">{usedCount(t)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-fg-subtle">Created</dt>
                <dd className="text-fg">{fmtDate(t.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-fg-subtle">Created by</dt>
                <dd className="truncate text-fg">{creatorOf(t) || "—"}</dd>
              </div>
            </dl>

            {t.aliases?.length > 0 && <AliasList aliases={t.aliases} />}

            <div className="flex gap-2">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tags() {
  const { can } = usePermission();
  const [params, setParams] = useState({ page: 1, limit: 20, search: "", status: "all", sort: "title" });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [merging, setMerging] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data, isLoading, error, refetch, isFetching } = useTags(params);
  const del = useApiMutation((detach) => httpClient.delete(`/tags/${deleting._id}`, { params: detach ? { detach: true } : {} }).then((r) => r.data), { invalidate: ["tags", "tag-suggest"], onSuccess: () => setDeleting(null) });
  const patch = (p) => setParams((s) => ({ ...s, page: 1, ...p }));

  // sm and up: the table, unchanged
  const columns = [
    {
      key: "title", header: "Topic", primary: true, cell: (t) => (
        <div className="min-w-0"><p className="flex items-center gap-1.5 font-medium text-fg">#{t.title}{t.isFeatured && <Star className="size-3.5 fill-warning text-warning" aria-label="Featured" />}</p><p className="truncate text-xs text-fg-subtle">/{t.slug}</p></div>)
    },
    {
      key: "aliases", header: "Aliases", cell: (t) => {
        const list = t.aliases || [];
        if (!list.length) return "—";
        return (
          <span className="flex max-w-56 items-center gap-1.5" title={list.join(", ")}>
            <span className="truncate text-xs">{list.slice(0, 2).join(", ")}</span>
            {list.length > 2 && <Badge size="sm">+{list.length - 2}</Badge>}
          </span>
        );
      },
    },
    { key: "news", header: "Used in", cell: (t) => <span className="tabular-nums">{usedCount(t)} <span className="text-fg-faint">news</span></span> },
    { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.isActive ? "active" : "inactive"} /> },
    {
      key: "createdAt", header: "Created", cell: (t) => (
        <div className="text-xs">
          <p>{fmtDate(t.createdAt)}</p>
          <p className="text-fg-subtle">by {creatorOf(t) || "—"}</p>
        </div>
      ),
    },
    {
      key: "actions", header: "", align: "right", cell: (t) => (
        <div className="flex justify-end gap-1">
          {can("tag.update") && <IconButton size="icon-sm" label="Edit topic" onClick={() => setEditing(t)}><Pencil className="size-4" /></IconButton>}
          {can("tag.merge") && <IconButton size="icon-sm" label="Merge into another topic" onClick={() => setMerging(t)}><GitMerge className="size-4" /></IconButton>}
          {can("tag.delete") && <IconButton size="icon-sm" label="Delete topic" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setDeleting(t)}><Trash2 className="size-4" /></IconButton>}
        </div>)
    },
  ];

  // below sm: collapsible card, same permissions as the table row
  const mobileCard = (t) => (
    <TagCard tag={t}>
      {can("tag.update") && <button type="button" className={cardBtn} onClick={() => setEditing(t)}><Pencil className="size-4" />Edit</button>}
      {can("tag.merge") && <button type="button" className={cardBtn} onClick={() => setMerging(t)}><GitMerge className="size-4" />Merge</button>}
      {can("tag.delete") && <button type="button" className={`${cardBtn} text-danger`} onClick={() => setDeleting(t)}><Trash2 className="size-4" />Delete</button>}
    </TagCard>
  );

  return (
    <>
      {/* Full-height page: header on top, card fills the rest, pagination pinned to the card's bottom edge. */}
      <div className="flex flex-col" style={{ minHeight: `calc(100dvh - ${PAGE_OFFSET})` }}>
        <PageHeader
          title="Topics"
          description="Topics group related stories and get their own page on the website. Reporters can also create topics straight from the news form."
          actions={can("tag.create") && <Button leftIcon={Plus} onClick={() => setEditing({})}>New topic</Button>}
        />
        <Card padded={false} className="flex min-h-0 flex-1 flex-col max-sm:shadow-none max-sm:border-none max-sm:bg-transparent">
          <div className="flex shrink-0 flex-col gap-2 sm:border-b border-line sm:p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4">
            <form className="w-full sm:max-w-xs lg:max-w-sm" onSubmit={(e) => { e.preventDefault(); patch({ search }); }}>
              <SearchInput
                value={search}
                onChange={(v) => { setSearch(v); if (!v) patch({ search: "" }); }}
                placeholder="Search title, alias or slug (Enter)"
              />
            </form>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* status tabs: take the free space on phones and scroll sideways if they don't fit */}
              <div className="min-w-0 flex-1 overflow-x-auto sm:flex-none">
                <Tabs
                  variant="pill"
                  value={params.status}
                  onChange={(status) => patch({ status })}
                  items={[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </div>

              {/* sort: compact on phones */}
              <div className="w-32 shrink-0 sm:w-40">
                <Select
                  size="sm"
                  aria-label="Sort"
                  value={params.sort}
                  onChange={(e) => patch({ sort: e.target.value })}
                  options={[
                    { value: "title", label: "A → Z" },
                    { value: "newest", label: "Newest" },
                    { value: "recent", label: "Recently used" },
                    { value: "used", label: "Most used" },
                  ]}
                />
              </div>
            </div>
          </div>
          {error ? <div className="flex-1"><ErrorState error={error} onRetry={refetch} /></div> : (
            <>
              {/* Table area grows and scrolls; pagination below never moves. */}
              <div className={`min-h-0 flex-1 overflow-auto mb-1 ${isFetching && !isLoading ? "opacity-70 transition-opacity" : ""}`}>
                <DataTable
                  breakpoint="sm"
                  columns={columns}
                  rows={data?.tags}
                  loading={isLoading}
                  mobileCard={mobileCard}
                  empty={<EmptyState icon={TagsIcon} title="No topics found" description="Try another search, or create the first tag." />}
                />
              </div>
              <Pagination page={params.page} total={data?.total || 0} limit={params.limit} onPage={(page) => setParams((s) => ({ ...s, page }))} onLimit={(limit) => patch({ limit })} className="shrink-0 border-t border-line" />
            </>
          )}
        </Card>
      </div>
      {editing && <TagFormModal tag={editing._id ? editing : null} onClose={() => setEditing(null)} />}
      {merging && <MergeDialog tag={merging} onClose={() => setMerging(null)} />}
      {deleting && (
        <ConfirmDialog open onClose={() => setDeleting(null)} tone="danger" title={`Delete “${deleting.title}”?`} loading={del.isPending}
          confirmLabel={deleting.newsCount ? "Remove from news & delete" : "Delete"} onConfirm={() => del.mutate(deleting.newsCount > 0)}
          message={deleting.newsCount ? `${deleting.newsCount} news use this topic. Deleting removes the topic from them. Consider merging it into another topic instead.` : "This tag is not used by any news."} />
      )}
    </>
  );
}