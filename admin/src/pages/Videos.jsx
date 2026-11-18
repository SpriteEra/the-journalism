import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, History, Pencil, Pin, PinOff, Plus, RefreshCw, RotateCcw, TextSearch, Trash2, Youtube } from "lucide-react";
import { cn } from "../lib/cn";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import httpClient from "../api/httpClient";
import { errMsg } from "../lib/api";
import { useFetchVideos } from "../hooks/ytnews";
import { fmtISTDateTime } from "../lib/time";
import VideoFilter from "../components/VideoFilter";
import UpdateStackPanel from "../components/UpdateStack";
import RowActions from "../components/common/RowActions";
import RowMenu from "../components/common/RowMenu";
import VideoCard, { VideoThumb } from "../components/video/Videocard";
import { Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, StatusBadge } from "../components/ui";
import usePermission from "../hooks/usePermission";
import ApprovalInfoModal, { ApprovalBadge, approvalState, hasApprovalInfo } from "../components/common/ApprovalInfoModal";

const EMPTY_FILTERS = { district: [], state: [], location: "", createdAt: "", search: "" };
const MAX_PINNED = 2; // keep in sync with MAX_PINNED on the server

const thumbOf = (item) => `https://img.youtube.com/vi/${item.videoLinkId}/mqdefault.jpg`;
const dateOf = (item) => fmtISTDateTime(item.publishedAt || item.createdAt);
const videoStatus = (item) => (item.draft ? "draft" : item.isPublished === false ? "pending" : "published");
// only a published item (not draft, not waiting for approval) can be pinned
const isPinnable = (item) => !item.draft && item.isPublished !== false && !item.need_approval;

const pinnedBadge = () => (
  <Badge tone="info" size="sm">
    <Pin className="mr-1 size-3" />Pinned
  </Badge>
);

const Videos = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermission();

  // only people who can approve may open the approval popup
  const canReview = can("yt.approve");
  // pinning needs the publish permission (same as the server); change to your pin permission if you add one
  const canPin = can("yt.publish");
  const [approval, setApproval] = useState(null);
  // hide the plain status badge while the item is waiting for approval
  const showStatus = (item) => approvalState(item) !== "pending";

  const [selectedOptions, setSelectedOptions] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [limit, setLimit] = useState(10);

  const [id, setId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isShowUpdatedStack, setIsShowUpdatedStack] = useState(false);

  // pin: { item, willRemove: [{ news_id, title }] } while the "replace the oldest pin?" dialog is open
  const [pinTarget, setPinTarget] = useState(null);
  const [pinning, setPinning] = useState(false);

  const { data, isPending, isFetching, isError, error, refetch } = useFetchVideos({
    page,
    limit,
    filters: appliedFilters,
  });

  useEffect(() => {
    setSearchParams({ page });
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openFilter = () => setIsFilterOpen(true);
  const closeFilter = () => setIsFilterOpen(false);

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({ ...selectedOptions, search });
  };

  const handleSubmit = () => {
    setPage(1);
    setAppliedFilters(selectedOptions);
  };

  const handleResetFilter = () => {
    setSelectedOptions(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setSearch("");
    setPage(1);
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    if (!id) return toast.error("Please try again");
    const loadingToast = toast.loading("Deleting...");
    try {
      setIsDeleting(true);
      await httpClient.delete(`delete-yt-news/${id}`);
      setIsModalOpen(false);
      setIsDeleting(false);
      toast.dismiss(loadingToast);
      toast.success("News Deleted Successfully");
      queryClient.invalidateQueries({ queryKey: ["yt-news"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    } catch (err) {
      toast.dismiss(loadingToast);
      console.log(err);
      setIsDeleting(false);
      toast.error("Failed to delete news");
      setIsModalOpen(false);
    }
  };

  // Pin / unpin one item. The confirmation opens ONLY when pinning hits the limit (server answers 409 PIN_LIMIT).
  // replace = true -> the server unpins the oldest pinned video(s) to make room.
  const sendPin = async (item, pin, replace = false) => {
    if (pinning) return;
    setPinning(true);
    const tid = toast.loading(pin ? "Pinning…" : "Unpinning…");
    try {
      await httpClient.patch(`/yt-news/${item.news_id}/pin`, { pin, replace });
      toast.success(pin ? (replace ? "Pinned. The oldest pin was removed" : "Pinned to top") : "Unpinned", { id: tid });
      setPinTarget(null);
      queryClient.invalidateQueries({ queryKey: ["yt-news"] });
    } catch (err) {
      const body = err?.response?.data;
      if (pin && !replace && err?.response?.status === 409 && body?.code === "PIN_LIMIT") {
        toast.dismiss(tid);
        setPinTarget({ item, willRemove: body.willRemove || [] });
      } else {
        toast.error(errMsg(err, pin ? "Could not pin the video" : "Could not unpin the video"), { id: tid });
        setPinTarget(null);
      }
    } finally {
      setPinning(false);
    }
  };

  // one definition, used by the table row AND the collapsible card
  const rowActions = (item) => (
    <RowActions
      row={item}
      share={{
        url: (r) => `${import.meta.env.VITE_CLIENT_URL}/video/${r.slug || r.news_id}`,
        title: (r) => r.title,
      }}
      actions={[
        {
          label: "Pin to top",
          icon: Pin,
          hidden: (r) => !canPin || r.isPinned || !isPinnable(r),
          onClick: (r) => sendPin(r, true),
        },
        {
          label: "Unpin",
          icon: PinOff,
          hidden: (r) => !canPin || !r.isPinned,
          onClick: (r) => sendPin(r, false),
        },
        {
          label: "Approval details",
          icon: BadgeCheck,
          hidden: (r) => !canReview || !hasApprovalInfo(r),
          onClick: (r) => setApproval(r),
        },
        {
          label: "History",
          icon: History,
          onClick: (r) => {
            setId(r.update_stack);
            setIsShowUpdatedStack(true);
          },
        },
        {
          label: "Edit",
          icon: Pencil,
          onClick: (r) => navigate(`/dashboard/videos/edit/${r.news_id}`),
        },
        {
          label: "Delete",
          icon: Trash2,
          danger: true,
          onClick: (r) => {
            setId(r.news_id);
            setIsModalOpen(true);
          },
        },
      ]}
    />
  );

  // a visible pin toggle in the row (the menu keeps the same actions). Shown only for published videos.
  const pinButton = (item) => {
    if (!canPin || !isPinnable(item)) return null;
    const on = !!item.isPinned;
    return (
      <button
        type="button"
        disabled={pinning}
        onClick={() => sendPin(item, !on)}
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

  const sourceBadge = () => <Badge tone="info" size="sm">YouTube · link</Badge>;

  // sm and up: the table
  const columns = [
    {
      key: "title",
      header: "Video",
      primary: true,
      cell: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <VideoThumb src={thumbOf(item)} />
            {item.isPinned && (
              <span className="absolute -left-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-info text-white shadow" title="Pinned">
                <Pin className="size-3.5" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            {item.isPinned && <div className="mb-1">{pinnedBadge()}</div>}
            <p className="hindi-font line-clamp-2 max-w-xs font-medium text-fg lg:text-base">{item.title}</p>
            <span className="text-xs">{dateOf(item)}</span>
          </div>
        </div>
      ),
    },
    { key: "source", header: "Source", cell: sourceBadge },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <div className="flex flex-col items-start gap-1.5">
          {showStatus(item) && <StatusBadge status={videoStatus(item)} />}
          <ApprovalBadge item={item} onClick={canReview ? setApproval : undefined} />
        </div>
      ),
    },
    { key: "by", header: "By", cell: (item) => item.author?.username || <span className="text-fg-faint">auto</span> },
    { key: "reads", header: "Reads", cell: (item) => <span className="tabular-nums">{item.activity?.total_reads ?? 0}</span> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1">
          {pinButton(item)}
          {rowActions(item)}
        </div>
      ),
    },
  ];

  // below sm: collapsible card
  const mobileCard = (item) => (
    <VideoCard
      thumbnail={thumbOf(item)}
      title={item.title}
      titleClassName="hindi-font"
      date={dateOf(item)}
      views={item.activity?.total_reads ?? 0}
    >
      <div className="flex flex-wrap items-center gap-2">
        {item.isPinned && pinnedBadge()}
        {sourceBadge()}
        {showStatus(item) && <StatusBadge status={videoStatus(item)} />}
        <ApprovalBadge item={item} onClick={canReview ? setApproval : undefined} />
      </div>
      <p className="text-sm text-fg-muted">By {item.author?.username || "auto"}</p>
      <div className="flex items-center gap-2">
        {pinButton(item)}
        {rowActions(item)}
      </div>
    </VideoCard>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <PageHeader
        title="YouTube news"
        description="Long landscape videos added from YouTube."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} aria-label="Reload" title="Reload" className="!px-2.5">
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            </Button>

            {/* md and up: normal buttons */}
            <div className="hidden items-center gap-2 md:flex">
              <Button leftIcon={Youtube} variant="outline" onClick={() => navigate("/dashboard/short-videos")}>
                Short Videos
              </Button>
              <Button leftIcon={Plus} onClick={() => navigate("/dashboard/videos/create")}>
                Add video
              </Button>
            </div>

            {/* below md: one button that opens the same actions */}
            <div className="md:hidden">
              <RowMenu
                variant="filled"
                icon={Plus}
                items={[
                  { label: "Short Videos", icon: Youtube, onClick: () => navigate("/dashboard/short-videos") },
                  { label: "Add video", icon: Plus, onClick: () => navigate("/dashboard/videos/create") },
                ]}
              />
            </div>
          </div>
        }
      />

      <Card padded={false} className="flex min-h-0 flex-1 flex-col overflow-hidden max-sm:border-none max-sm:bg-transparent max-sm:p-0">
        {/* toolbar: stays fixed. Phone = one row (search + Filter / Reset icons) */}
        <div className="flex shrink-0 items-center gap-2 border-line sm:gap-3 sm:border-b sm:p-4 xl:justify-between">
          <form className="min-w-0 flex-1 xl:max-w-sm" onSubmit={handleSubmitSearch}>
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                if (!v) {
                  setPage(1);
                  setAppliedFilters((s) => ({ ...s, search: "" }));
                }
              }}
              placeholder="Search title (Enter)"
            />
          </form>
          <div className="flex shrink-0 items-center gap-2">
            <span className="mr-2 hidden text-sm text-fg-subtle sm:inline">
              Total: <b className="text-fg">{data?.total ?? 0}</b>
            </span>
            <Button variant="outline" leftIcon={TextSearch} onClick={openFilter} aria-label="Filter">
              <span className="max-sm:hidden">Filter</span>
            </Button>
            <Button variant="outline" leftIcon={RotateCcw} onClick={handleResetFilter} aria-label="Reset filters">
              <span className="max-sm:hidden">Reset</span>
            </Button>
          </div>
        </div>

        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            {/* DataTable (contained) is the only part that scrolls */}
            <DataTable
              contained
              breakpoint="sm"
              columns={columns}
              rows={data?.news}
              loading={isPending}
              mobileCard={mobileCard}
              empty={
                <EmptyState
                  icon={Youtube}
                  title="No videos found"
                  description="Add a YouTube link to get started."
                />
              }
            />
            {/* pagination: stays fixed at the bottom */}
            <Pagination
              page={page}
              total={data?.total || 0}
              limit={limit}
              onPage={setPage}
              onLimit={(l) => {
                setLimit(l);
                setPage(1);
              }}
              className="shrink-0 border-t border-line bg-surface"
            />
          </>
        )}
      </Card>

      {isModalOpen && (
        <ConfirmDialog
          open
          onClose={() => setIsModalOpen(false)}
          tone="danger"
          loading={isDeleting}
          onConfirm={handleDelete}
          confirmLabel="Delete"
          title="Delete this video?"
          message="This action cannot be undone."
        />
      )}

      {/* opened only when a pin request hits the limit; plain pin / unpin never asks */}
      {pinTarget && (
        <ConfirmDialog
          open
          onClose={() => setPinTarget(null)}
          loading={pinning}
          onConfirm={() => sendPin(pinTarget.item, true, true)}
          confirmLabel="Replace and pin"
          title="Replace pinned video?"
          message={`${MAX_PINNED} videos are already pinned. Pinning "${pinTarget.item.title}" will unpin the oldest: ${pinTarget.willRemove.map((v) => v.title).join(", ") || "the oldest pinned video"
            }.`}
        />
      )}

      <VideoFilter
        handleSubmit={handleSubmit}
        setSelectedOptions={setSelectedOptions}
        selectedOptions={selectedOptions}
        isOpen={isFilterOpen}
        onClose={closeFilter}
      />
      <UpdateStackPanel
        isOpen={isShowUpdatedStack}
        onClose={() => setIsShowUpdatedStack(false)}
        stack_id={id}
      />
      <ApprovalInfoModal
        item={canReview ? approval : null}
        onClose={() => setApproval(null)}
        reviewTo={approval ? `/dashboard/review/yt/${approval.news_id}` : undefined}
      />
    </div>
  );
};

export default Videos;