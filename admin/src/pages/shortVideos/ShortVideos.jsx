import { useState } from "react";
import { BadgeCheck, Link2, Pencil, Pin, PinOff, Plus, PlaySquare, RefreshCw, Trash2, Upload, Youtube } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "../../lib/cn";
import { errMsg } from "../../lib/api";
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
import ApprovalInfoModal, { ApprovalBadge, approvalState, hasApprovalInfo } from "../../components/common/ApprovalInfoModal";

const SOURCE = { youtube_auto: ["info", "YouTube · auto"], youtube_manual: ["info", "YouTube · link"], upload: ["accent", "Uploaded"] };
const MAX_PINNED = 10; // keep in sync with MAX_PINNED on the server

const isPortrait = (v) => v.kind === "short" || (v.height && v.width && v.height > v.width);
const status = (v) => (v.draft ? "draft" : v.isPublished ? "published" : "pending");
const dateOf = (v) => fmtISTDateTime(v.publishedAt || v.createdAt);
// hide the plain status badge while the item is waiting for approval
const showStatus = (v) => approvalState(v) !== "pending";
// only a published item (not draft, not waiting for approval) can be pinned
const isPinnable = (v) => !v.draft && v.isPublished !== false && !v.need_approval;

const pinnedBadge = () => (
  <Badge tone="info" size="sm">
    <Pin className="mr-1 size-3" />Pinned
  </Badge>
);

export default function ShortVideos() {
  const { can } = usePermission();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canReview = can("video.approve");           // only approvers can open the approval popup
  // pinning needs the publish permission (same as the server); change to your pin permission if you add one
  const canPin = can("video.publish");
  const [params, setParams] = useState({
    page: 1, limit: 20, kind: "all", sourceType: "all",
    pending: "", pinned: "", pinFirst: "true", search: "",
  });
  const pinnedOnly = params.pinned === "true";
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [approval, setApproval] = useState(null);   // the row whose approval popup is open
  // pin: { item, willRemove: [{ slug, title }] } while the "replace the oldest pin?" dialog is open
  const [pinTarget, setPinTarget] = useState(null);
  const [pinning, setPinning] = useState(false);
  const { data, isLoading, isFetching, error, refetch } = useShortVideos(params);
  const patch = (p) => setParams((s) => ({ ...s, page: 1, ...p }));
  const del = useApiMutation(() => httpClient.delete(`/short-videos/${deleting.slug}`).then((r) => r.data), { invalidate: ["short-videos"], onSuccess: () => setDeleting(null) });

  // Pin / unpin one item. The confirmation opens ONLY when pinning hits the limit (server answers 409).
  // replace = true -> the server unpins the oldest pinned video(s) to make room.
  const sendPin = async (item, pin, replace = false) => {
    if (pinning) return;
    setPinning(true);
    const tid = toast.loading(pin ? "Pinning…" : "Unpinning…");
    try {
      await httpClient.patch(`/short-videos/${item.slug}/pin`, { pin, replace });
      toast.success(pin ? (replace ? "Pinned. The oldest pin was removed" : "Pinned to top") : "Unpinned", { id: tid });
      setPinTarget(null);
      queryClient.invalidateQueries({ queryKey: ["short-videos"] });
    } catch (err) {
      const body = err?.response?.data;
      // 409 from the pin endpoint always means "limit reached"
      if (pin && !replace && err?.response?.status === 409) {
        toast.dismiss(tid);
        setPinTarget({ item, willRemove: body?.willRemove || [] });
      } else {
        toast.error(errMsg(err, pin ? "Could not pin the video" : "Could not unpin the video"), { id: tid });
        setPinTarget(null);
      }
    } finally {
      setPinning(false);
    }
  };

  // one definition, used by the table row AND the collapsed card
  const rowActions = (v) => (
    <RowActions
      row={v}
      share={{ url: (r) => siteUrl(`/shorts/${r.slug}`), title: (r) => r.title }}
      actions={[
        { label: "Pin to top", icon: Pin, hidden: (r) => !canPin || r.isPinned || !isPinnable(r), onClick: (r) => sendPin(r, true) },
        { label: "Unpin", icon: PinOff, hidden: (r) => !canPin || !r.isPinned, onClick: (r) => sendPin(r, false) },
        { label: "Approval details", icon: BadgeCheck, hidden: (r) => !canReview || !hasApprovalInfo(r), onClick: (r) => setApproval(r) },
        { label: "Edit", icon: Pencil, onClick: (r) => navigate(`${r.slug}/edit`) },
        { label: "Delete", icon: Trash2, danger: true, onClick: (r) => setDeleting(r) },
      ]}
    />
  );

  // a visible pin toggle in the row (the menu keeps the same actions). Shown only for published videos.
  const pinButton = (v) => {
    if (!canPin || !isPinnable(v)) return null;
    const on = !!v.isPinned;
    return (
      <button
        type="button"
        disabled={pinning}
        onClick={() => sendPin(v, !on)}
        title={on ? "Unpin" : "Pin to top"}
        aria-label={on ? "Unpin" : "Pin to top"}
        className={cn(
          "grid size-8 place-items-center rounded-lg transition-colors disabled:opacity-50",
          on ? "bg-info-soft text-info" : "text-fg-muted hover:bg-surface-2"
        )}
      >
        <Pin className={cn("size-4", on && "fill-current")} />
      </button>
    );
  };

  const typeBadge = (v) => <Badge tone={v.kind === "short" ? "accent" : "primary"}>{v.kind === "short" ? "Short" : "Video"}</Badge>;
  const sourceBadge = (v) => <Badge tone={SOURCE[v.sourceType]?.[0]} size="sm">{SOURCE[v.sourceType]?.[1]}</Badge>;

  // sm and up: the table
  const columns = [
    {
      key: "title", header: "Video", primary: true, cell: (v) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <VideoThumb src={v.thumbnail} portrait={isPortrait(v)} duration={v.duration} />
            {v.isPinned && (
              <span className="absolute -left-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-info text-white shadow" title="Pinned">
                <Pin className="size-3.5" />
              </span>
            )}
          </div>
          <div>
            {v.isPinned && <div className="mb-1">{pinnedBadge()}</div>}
            <p className="line-clamp-2 max-w-xs font-medium text-fg lg:text-base">{v.title}</p>
            <span className="text-xs">{dateOf(v)}</span>
          </div>
        </div>
      ),
    },
    { key: "kind", header: "Type", cell: typeBadge },
    { key: "source", header: "Source", cell: sourceBadge },
    {
      key: "status", header: "Status", cell: (v) => (
        <div className="flex flex-col items-start gap-1.5">
          {showStatus(v) && <StatusBadge status={status(v)} />}
          <ApprovalBadge item={v} onClick={canReview ? setApproval : undefined} />
        </div>
      ),
    },
    { key: "by", header: "By", cell: (v) => v.author?.username || <span className="text-fg-faint">auto</span> },
    { key: "date", header: "Reads", cell: (v) => <span className="text-xs">{v.activity?.total_reads ?? 0}</span> },
    {
      key: "actions", header: "Actions", align: "right", cell: (v) => (
        <div className="flex items-center justify-end gap-1">
          {pinButton(v)}
          {rowActions(v)}
        </div>
      ),
    },
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
        {v.isPinned && pinnedBadge()}
        {typeBadge(v)}
        {sourceBadge(v)}
        {showStatus(v) && <StatusBadge status={status(v)} />}
        <ApprovalBadge item={v} onClick={canReview ? setApproval : undefined} />
      </div>
      <p className="text-sm text-fg-muted">By {v.author?.username || "auto"}</p>
      <div className="flex items-center gap-2">
        {pinButton(v)}
        {rowActions(v)}
      </div>
    </VideoCard>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <PageHeader
        title="Shorts videos"
        description="YouTube links and your own uploads (stored on Cloudflare) in one place."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} aria-label="Reload" title="Reload" className="!px-2.5">
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
            {can("video.create") && (
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
          </div>
        }
      />

      <Card padded={false} className="flex min-h-0 flex-1 flex-col overflow-hidden max-sm:border-none max-sm:bg-transparent max-sm:p-0">
        <div className="flex items-center gap-2 border-line sm:justify-between sm:gap-3 sm:border-b sm:p-4">
          <form className="w-full xl:max-w-sm" onSubmit={(e) => { e.preventDefault(); patch({ search }); }}>
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); if (!v) patch({ search: "" }); }}
              placeholder="Search title or tag (Enter)"
            />
          </form>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* show only pinned videos (the server returns pinnedCount so the button can show x / MAX) */}
            <Button
              type="button"
              variant={pinnedOnly ? undefined : "outline"}
              leftIcon={Pin}
              onClick={() => patch({ pinned: pinnedOnly ? "" : "true" })}
              aria-pressed={pinnedOnly}
              aria-label="Show pinned videos only"
              title={pinnedOnly ? "Show all videos" : "Show pinned videos only"}
            >
              <span className="max-sm:hidden">
                Pinned{data?.pinnedCount !== undefined ? ` (${data.pinnedCount}/${MAX_PINNED})` : ""}
              </span>
            </Button>

            {/* pin order: pinned on top, or one normal list by date */}
            <div className="sm:w-40 max-sm:w-24">
              <Select
                size="sm"
                aria-label="Pin order"
                value={params.pinFirst}
                disabled={pinnedOnly}   // order doesn't matter when only pinned items are shown
                onChange={(e) => patch({ pinFirst: e.target.value })}
                options={[
                  { value: "true", label: "Pinned on top" },
                  { value: "false", label: "Normal list" },
                ]}
              />
            </div>

            <div className="sm:w-44 max-sm:w-20">
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
                empty={
                  <EmptyState
                    icon={pinnedOnly ? Pin : PlaySquare}
                    title={pinnedOnly ? "No pinned videos" : "No videos found"}
                    description={pinnedOnly ? "Pin a published video from the list to see it here." : "Upload a file or add a YouTube link to get started."}
                  />
                }
              />
            </div>
            <Pagination page={params.page} total={data?.total || 0} limit={params.limit} onPage={(page) => setParams((s) => ({ ...s, page }))} onLimit={(limit) => patch({ limit })} className="shrink-0 border-t border-line bg-surface" />
          </>
        )}
      </Card>

      {deleting && <ConfirmDialog open onClose={() => setDeleting(null)} tone="danger" loading={del.isPending} onConfirm={() => del.mutate()} confirmLabel="Delete" title="Delete this video?" message={`“${deleting.title}” will be removed from the website.`} />}

      {/* opened only when a pin request hits the limit; plain pin / unpin never asks */}
      {pinTarget && (
        <ConfirmDialog
          open
          onClose={() => setPinTarget(null)}
          loading={pinning}
          onConfirm={() => sendPin(pinTarget.item, true, true)}
          confirmLabel="Replace and pin"
          title="Replace pinned video?"
          message={`${MAX_PINNED} videos are already pinned. If you pin “${pinTarget.item.title}”, the oldest pinned video (${pinTarget.willRemove.map((v) => v.title).join(", ") || "the first one you pinned"
            }) will be unpinned automatically.`}
        />
      )}

      <ApprovalInfoModal
        item={canReview ? approval : null}
        onClose={() => setApproval(null)}
        reviewTo={approval ? `/dashboard/review/short/${approval.slug}` : undefined}
      />
    </div>
  );
}