import { useState } from "react";
import { GitMerge, Pencil, Plus, Star, Tags as TagsIcon, Trash2 } from "lucide-react";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import { useApiMutation, useTagSuggest, useTags } from "../../hooks/admin";
import { fmtDate } from "../../lib/api";
import {
  Badge, Button, Card, ChipInput, ConfirmDialog, DataTable, EmptyState, ErrorState, Field, IconButton, Input, Modal, PageHeader, Pagination,
  SearchInput, Select, StatusBadge, Switch, Tabs, Textarea,
} from "../../components/ui";
import TagFormModal from "./TagFormModal";

const blank = { title: "", aliases: [], description: "", language: "hi", isActive: true, isFeatured: false, seo: { metaTitle: "", metaDescription: "" } };

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

  const columns = [
    {
      key: "title", header: "Topic", primary: true, cell: (t) => (
        <div className="min-w-0"><p className="flex items-center gap-1.5 font-medium text-fg">#{t.title}{t.isFeatured && <Star className="size-3.5 fill-warning text-warning" aria-label="Featured" />}</p><p className="truncate text-xs text-fg-subtle">/{t.slug}</p></div>)
    },
    { key: "aliases", header: "Aliases", hideOnMobile: true, cell: (t) => (t.aliases?.length ? <span className="line-clamp-1 max-w-48 text-xs">{t.aliases.join(", ")}</span> : "—") },
    { key: "news", header: "News", cell: (t) => <span className="tabular-nums">{t.publishedCount}<span className="text-fg-faint"> / {t.newsCount}</span></span> },
    { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.isActive ? "active" : "inactive"} /> },
    { key: "createdAt", header: "Created", cell: (t) => <span className="text-xs">{fmtDate(t.createdAt)}</span> },
    {
      key: "actions", header: "", align: "right", cell: (t) => (
        <div className="flex justify-end gap-1">
          {can("tag.update") && <IconButton size="icon-sm" label="Edit topic" onClick={() => setEditing(t)}><Pencil className="size-4" /></IconButton>}
          {can("tag.merge") && <IconButton size="icon-sm" label="Merge into another topic" onClick={() => setMerging(t)}><GitMerge className="size-4" /></IconButton>}
          {can("tag.delete") && <IconButton size="icon-sm" label="Delete topic" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setDeleting(t)}><Trash2 className="size-4" /></IconButton>}
        </div>)
    },
  ];

  return (
    <>
      <PageHeader title="Topics" description="Topics group related stories and get their own page on the website. Reporters can also create topics straight from the news form."
        actions={can("tag.create") && <Button leftIcon={Plus} onClick={() => setEditing({})}>New topic</Button>} />
      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <form className="w-full lg:max-w-sm" onSubmit={(e) => { e.preventDefault(); patch({ search }); }}>
            <SearchInput value={search} onChange={(v) => { setSearch(v); if (!v) patch({ search: "" }); }} placeholder="Search title, alias or slug (Enter)" />
          </form>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs variant="pill" value={params.status} onChange={(status) => patch({ status })} items={[{ value: "all", label: "All" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
            <div className="w-40"><Select size="sm" aria-label="Sort" value={params.sort} onChange={(e) => patch({ sort: e.target.value })} options={[{ value: "title", label: "A → Z" }, { value: "newest", label: "Newest" }, { value: "recent", label: "Recently used" }, { value: "used", label: "Most used" }]} /></div>
          </div>
        </div>
        {error ? <ErrorState error={error} onRetry={refetch} /> : (
          <>
            <div className={isFetching && !isLoading ? "opacity-70 transition-opacity" : ""}>
              <DataTable columns={columns} rows={data?.tags} loading={isLoading} empty={<EmptyState icon={TagsIcon} title="No topics found" description="Try another search, or create the first tag." />} />
            </div>
            <Pagination page={params.page} total={data?.total || 0} limit={params.limit} onPage={(page) => setParams((s) => ({ ...s, page }))} onLimit={(limit) => patch({ limit })} className="border-t border-line" />
          </>
        )}
      </Card>
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
