import { useState } from "react";
import { CheckCircle2, Link2, Pencil, Plus, PlaySquare, Trash2, Upload, Youtube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import { useApiMutation, useShortVideos } from "../../hooks/admin";
import { Alert, Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, Select, StatusBadge } from "../../components/ui";
import { fmtISTDateTime } from "../../lib/time";
import { siteUrl } from "../../lib/share";
import RowActions from "../../components/common/RowActions";
import RowMenu from "../../components/common/RowMenu";
import VideoCard, { VideoThumb } from "../../components/video/Videocard";
// import VideoCard, { VideoThumb } from "../../components/common/VideoCard";

const SOURCE = { youtube_auto: ["info", "YouTube · auto"], youtube_manual: ["info", "YouTube · link"], upload: ["accent", "Uploaded"] };

const isPortrait = (v) => v.kind === "short" || (v.height && v.width && v.height > v.width);
const status = (v) => (v.draft ? "draft" : v.isPublished ? "published" : "pending");
const dateOf = (v) => fmtISTDateTime(v.publishedAt || v.createdAt);

export default function ShortVideos() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const [params, setParams] = useState({ page: 1, limit: 20, kind: "all", sourceType: "all", pending: "", search: "" });
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const { data, isLoading, error, refetch } = useShortVideos(params);
  const patch = (p) => setParams((s) => ({ ...s, page: 1, ...p }));
  const approve = useApiMutation((v) => httpClient.put(`/short-videos/${v.slug}`, { approve: true }).then((r) => r.data), { invalidate: ["short-videos"], success: "Approved and published" });
  const del = useApiMutation(() => httpClient.delete(`/short-videos/${deleting.slug}`).then((r) => r.data), { invalidate: ["short-videos"], onSuccess: () => setDeleting(null) });

  // one definition, used by the table row AND the collapsed card
  const rowActions = (v) => (
    <RowActions
      row={v}
      share={{ url: (r) => siteUrl(`/shorts/${r.slug}`), title: (r) => r.title }}
      actions={[
        { label: "Approve & publish", icon: CheckCircle2, hidden: (r) => !(can("video.manage.any") && !r.isPublished && !r.draft), onClick: (r) => approve.mutate(r) },
        { label: "Edit", icon: Pencil, onClick: (r) => navigate(`${r.slug}/edit`) },
        { label: "Delete", icon: Trash2, danger: true, onClick: (r) => setDeleting(r) },
      ]}
    />
  );

  const typeBadge = (v) => <Badge tone={v.kind === "short" ? "accent" : "primary"}>{v.kind === "short" ? "Short" : "Video"}</Badge>;
  const sourceBadge = (v) => <Badge tone={SOURCE[v.sourceType]?.[0]} size="sm">{SOURCE[v.sourceType]?.[1]}</Badge>;

  // sm and up: the table, unchanged
  const columns = [
    {
      key: "title", header: "Video", primary: true, cell: (v) => (
        <div className="flex min-w-0 items-center gap-3">
          <VideoThumb src={v.thumbnail} portrait={isPortrait(v)} duration={v.duration} />
          <p className="line-clamp-2 max-w-xs font-medium text-fg lg:text-base">{v.title}</p>
        </div>
      ),
    },
    { key: "kind", header: "Type", cell: typeBadge },
    { key: "source", header: "Source", cell: sourceBadge },
    { key: "status", header: "Status", cell: (v) => <StatusBadge status={status(v)} /> },
    { key: "by", header: "By", cell: (v) => v.author?.username || <span className="text-fg-faint">auto</span> },
    { key: "date", header: "Published", cell: (v) => <span className="text-xs">{dateOf(v)}</span> },
    { key: "actions", header: "Actions", align: "right", cell: rowActions },
  ];

  // below sm: collapsible card
  const mobileCard = (v) => (
    <VideoCard
      thumbnail={v.thumbnail}
      portrait={isPortrait(v)}
      duration={v.duration}
      title={v.title}
      date={dateOf(v)}
      views={v.activity?.total_reads ?? v.views ?? 0}
    >
      <div className="flex flex-wrap items-center gap-2">
        {typeBadge(v)}
        {sourceBadge(v)}
        <StatusBadge status={status(v)} />
      </div>
      <p className="text-sm text-fg-muted">By {v.author?.username || "auto"}</p>
      {rowActions(v)}
    </VideoCard>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <PageHeader
        title="Shorts videos"
        description="YouTube links and your own uploads (stored on Cloudflare) in one place."
        actions={can("video.create") && (
          <>
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="outline" leftIcon={Youtube} onClick={() => navigate("/dashboard/videos")}>YouTube Video</Button>
              <Button variant="outline" leftIcon={Youtube} onClick={() => navigate("/dashboard/short-videos/new?mode=youtube")}>YouTube Short link</Button>
              <Button leftIcon={Upload} onClick={() => navigate("/dashboard/short-videos/new?mode=upload")}>Upload</Button>
            </div>
            <div className="md:hidden">
              <RowMenu
                variant="filled"
                icon={Plus}
                items={[
                  { label: "YouTube Video", icon: Youtube, onClick: () => navigate("/dashboard/videos") },
                  { label: "YouTube Short link", icon: Link2, onClick: () => navigate("/dashboard/short-videos/new?mode=youtube") },
                  { label: "Upload short", icon: Upload, onClick: () => navigate("/dashboard/short-videos/new?mode=upload") },
                ]}
              />
            </div>
          </>
        )}
      />

      {data?.items && params.pending !== "true" && data.items.some((v) => !v.isPublished && !v.draft) && can("video.manage.any") && (
        <Alert tone="warning" className="mb-4" title="Some videos are waiting for approval" action={<Button size="sm" variant="outline" onClick={() => patch({ pending: "true" })}>Show pending</Button>} />
      )}

      <Card padded={false} className="flex min-h-0 flex-1 flex-col overflow-hidden max-sm:border-none max-sm:bg-transparent max-sm:p-0">
        <div className="flex items-center gap-2 border-line sm:justify-between sm:gap-3 sm:border-b sm:p-4">
          <form className="w-full xl:max-w-sm" onSubmit={(e) => { e.preventDefault(); patch({ search }); }}>
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); if (!v) patch({ search: "" }); }}
              placeholder="Search title or tag (Enter)"
            />
          </form>
          <div className="flex flex-wrap items-center gap-3 max-sm:max-w-20">
            <div className="sm:w-44">
              <Select
                size="sm"
                aria-label="Source"
                value={params.sourceType}
                onChange={(e) => patch({ sourceType: e.target.value })}
                options={[
                  { value: "all", label: "Any source" },
                  { value: "upload", label: "Uploaded" },
                  { value: "youtube_manual", label: "YouTube link" },
                  { value: "youtube_auto", label: "YouTube auto" },
                ]}
              />
            </div>
          </div>
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
                empty={<EmptyState icon={PlaySquare} title="No videos found" description="Upload a file or add a YouTube link to get started." />}
              />
            </div>
            <Pagination page={params.page} total={data?.total || 0} limit={params.limit} onPage={(page) => setParams((s) => ({ ...s, page }))} onLimit={(limit) => patch({ limit })} className="shrink-0 border-t border-line bg-surface" />
          </>
        )}
      </Card>

      {deleting && <ConfirmDialog open onClose={() => setDeleting(null)} tone="danger" loading={del.isPending} onConfirm={() => del.mutate()} confirmLabel="Delete" title="Delete this video?" message={`“${deleting.title}” will be removed from the website.`} />}
    </div>
  );
}