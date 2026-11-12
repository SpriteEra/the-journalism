import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, ExternalLink, Eye, Pencil, Plus, Radio, RefreshCw, Trash2, Zap } from "lucide-react";
import { cn } from "../../lib/cn";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import { useApiMutation } from "../../hooks/admin";
import { useLiveNewsList } from "../../hooks/live";
import { Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, StatusBadge, Tabs } from "../../components/ui";
import RowActions from "../../components/common/RowActions";
import ApprovalInfoModal, { ApprovalBadge, approvalState, hasApprovalInfo } from "../../components/common/ApprovalInfoModal";
import { fmtISTDateTime } from "../../lib/time";
import { siteUrl } from "../../lib/share";

const TABS = [
  { value: "all", label: "All" },
  { value: "live", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "draft", label: "Drafts" },
  { value: "ended", label: "Ended" },
];

/** the one date that matters for each state */
const whenOf = (l) => {
  if (l.status === "live") return ["Published", l.post_time || l.startTime];
  if (l.status === "scheduled") return ["Starts", l.startTime];
  if (l.status === "ended") return ["Ended", l.endTime];
  return ["Created", l.createdAt];
};

function Cover({ src, alt }) {
  return src
    ? <img src={src} alt={alt || ""} loading="lazy" className="h-12 w-20 shrink-0 rounded-md bg-surface-3 object-cover" />
    : <span className="grid h-12 w-20 shrink-0 place-items-center rounded-md bg-surface-3 text-fg-faint"><Radio className="size-5" /></span>;
}

export default function LiveNews() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const [params, setParams] = useState({ page: 1, limit: 20, status: "all", search: "" });
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [approval, setApproval] = useState(null);   // the row whose approval popup is open
  const { data, isLoading, isFetching, error, refetch } = useLiveNewsList(params);
  const patch = (p) => setParams((s) => ({ ...s, page: 1, ...p }));
  const canReview = can("live.manage.any");
  const goLive = useApiMutation((l) => httpClient.put(`/live/${l.slug}`, { status: "live" }).then((r) => r.data), { invalidate: ["live-news"], success: "Published" });
  const del = useApiMutation(() => httpClient.delete(`/live/${deleting.slug}`).then((r) => r.data), { invalidate: ["live-news"], onSuccess: () => setDeleting(null) });
  const showStatus = (l) => approvalState(l) !== "pending";
  const rowActions = (l) => (
    <RowActions
      row={l}
      share={["live", "ended"].includes(l.status) ? { url: (r) => siteUrl(`/live/${r.slug}`), title: (r) => r.title } : undefined}
      actions={[
        { label: "Edit", icon: Pencil, onClick: (r) => navigate(`/dashboard/live/${r.slug}/edit`) },
        { label: "Approval details", icon: BadgeCheck, hidden: (r) => !canReview || !hasApprovalInfo(r), onClick: (r) => setApproval(r) },
        { label: "Publish now", icon: Zap, hidden: (r) => !["draft", "scheduled"].includes(r.status) || !can("live.publish"), onClick: (r) => goLive.mutate(r) },
        { label: "View on website", icon: ExternalLink, hidden: (r) => !["live", "ended"].includes(r.status), onClick: (r) => window.open(siteUrl(`/live/${r.slug}`), "_blank", "noopener") },
        { label: "Delete", icon: Trash2, danger: true, onClick: (r) => setDeleting(r) },
      ]}
    />
  );

  const columns = [
    {
      key: "title", header: "Live news", primary: true, cell: (l) => (
        <div className="flex min-w-0 items-center gap-3">
          <Cover src={l.image} alt={l.title} />
          <p className="line-clamp-2 max-w-sm font-medium text-fg lg:text-base">{l.title}</p>
        </div>
      ),
    },
    {
      key: "status", header: "Status", cell: (l) => (
        <div className="flex flex-col items-start gap-1.5">
          {showStatus(l) && <StatusBadge status={l.status === "live" ? "published" : l.status} />}
          <ApprovalBadge item={l} onClick={canReview ? setApproval : undefined} />
        </div>
      ),
    },
    { key: "by", header: "By", cell: (l) => l.author?.username || "—" },
    { key: "when", header: "Time", cell: (l) => { const [label, at] = whenOf(l); return <span className="text-xs"><span className="text-fg-subtle">{label}</span><br />{fmtISTDateTime(at)}</span>; } },
    { key: "views", header: "Views", align: "right", cell: (l) => <span className="inline-flex items-center gap-1 text-fg-muted"><Eye className="size-3.5" />{l.activity?.total_reads ?? 0}</span> },
    { key: "actions", header: "Actions", align: "right", cell: rowActions },
  ];

  const mobileCard = (l) => {
    const [label, at] = whenOf(l);
    return (
      <div className="space-y-3 rounded-xl border border-line bg-surface p-3">
        <div className="flex items-start gap-3">
          <Cover src={l.image} alt={l.title} />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium text-fg">{l.title}</p>
            <p className="mt-1 text-xs text-fg-subtle">{label} {fmtISTDateTime(at)} · {l.author?.username || "—"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {showStatus(l) && <StatusBadge status={l.status === "live" ? "published" : l.status} />}
            <ApprovalBadge item={l} onClick={canReview ? setApproval : undefined} />
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-fg-subtle"><Eye className="size-3.5" />{l.activity?.total_reads ?? 0}</span>
        </div>
        {rowActions(l)}
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <PageHeader
        title="Live news"
        description="Write a live story and publish it on the website."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} aria-label="Reload" title="Reload" className="!px-2.5">
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
            {can("live.create") && <Button leftIcon={Plus} onClick={() => navigate("/dashboard/live/new")}>New live news</Button>}
          </div>
        }
      />

      <Card padded={false} className="flex min-h-0 flex-1 flex-col overflow-hidden max-sm:border-none max-sm:bg-transparent max-sm:p-0">
        <div className="flex flex-col gap-3 border-line sm:border-b sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs variant="pill" value={params.status} onChange={(status) => patch({ status })} items={TABS} />
          <form className="w-full lg:max-w-sm" onSubmit={(e) => { e.preventDefault(); patch({ search }); }}>
            <SearchInput value={search} onChange={(v) => { setSearch(v); if (!v) patch({ search: "" }); }} placeholder="Search title (Enter)" />
          </form>
        </div>

        {error ? <ErrorState error={error} onRetry={refetch} /> : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <DataTable
                contained
                breakpoint="sm"
                columns={columns}
                rows={data?.items}
                loading={isLoading}
                mobileCard={mobileCard}
                empty={<EmptyState icon={Radio} title="No live news yet" description="Create one to start covering an event live." action={can("live.create") && <Button leftIcon={Plus} onClick={() => navigate("/dashboard/live/new")}>New live news</Button>} />}
              />
            </div>
            <Pagination page={params.page} total={data?.total || 0} limit={params.limit} onPage={(page) => setParams((s) => ({ ...s, page }))} onLimit={(limit) => patch({ limit })} className="shrink-0 border-t border-line bg-surface" />
          </>
        )}
      </Card>

      {deleting && <ConfirmDialog open onClose={() => setDeleting(null)} tone="danger" loading={del.isPending} onConfirm={() => del.mutate()} confirmLabel="Delete" title="Delete this live news?" message={`“${deleting.title}” will be removed from the website.`} />}
      <ApprovalInfoModal
        item={canReview ? approval : null}
        onClose={() => setApproval(null)}
        reviewTo={approval ? `/dashboard/review/live/${approval.slug}` : undefined}
      />
    </div>
  );
}