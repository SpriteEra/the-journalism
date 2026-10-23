import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { History, Pencil, Plus, RotateCcw, TextSearch, Trash2, Youtube } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import httpClient from "../api/httpClient";
import { useFetchVideos } from "../hooks/ytnews";
import { fmtISTDateTime } from "../lib/time";
import VideoFilter from "../components/VideoFilter";
import UpdateStackPanel from "../components/UpdateStack";
import RowActions from "../components/common/RowActions";
import RowMenu from "../components/common/RowMenu";
import VideoCard, { VideoThumb } from "../components/video/Videocard";
import { Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, StatusBadge } from "../components/ui";

const EMPTY_FILTERS = { district: [], state: [], location: "", createdAt: "", search: "" };

const thumbOf = (item) => `https://img.youtube.com/vi/${item.videoLinkId}/mqdefault.jpg`;
const dateOf = (item) => fmtISTDateTime(item.publishedAt || item.createdAt);
const videoStatus = (item) => (item.draft ? "draft" : item.isPublished === false ? "pending" : "published");

const Videos = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

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

  const { data, isPending, isError, error, refetch } = useFetchVideos({
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
    } catch (err) {
      toast.dismiss(loadingToast);
      console.log(err);
      setIsDeleting(false);
      toast.error("Failed to delete news");
      setIsModalOpen(false);
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

  const typeBadge = () => <Badge tone="primary">Video</Badge>;
  const sourceBadge = () => <Badge tone="info" size="sm">YouTube · link</Badge>;

  // sm and up: the table, unchanged
  const columns = [
    {
      key: "title",
      header: "Video",
      primary: true,
      cell: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <VideoThumb src={thumbOf(item)} />
          <div className="min-w-0">
            <p className="hindi-font line-clamp-2 max-w-xs font-medium text-fg lg:text-base">{item.title}</p>
            <span className="text-xs">{dateOf(item)}</span>
          </div>
        </div>
      ),
    },
    { key: "kind", header: "Type", cell: typeBadge },
    { key: "source", header: "Source", cell: sourceBadge },
    { key: "status", header: "Status", cell: (item) => <StatusBadge status={videoStatus(item)} /> },
    { key: "by", header: "By", cell: (item) => item.author?.username || <span className="text-fg-faint">auto</span> },
    { key: "reads", header: "Reads", cell: (item) => <span className="tabular-nums">{item.activity?.total_reads ?? 0}</span> },
    { key: "actions", header: "Actions", align: "right", cell: rowActions },
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
        {typeBadge()}
        {sourceBadge()}
        <StatusBadge status={videoStatus(item)} />
      </div>
      <p className="text-sm text-fg-muted">By {item.author?.username || "auto"}</p>
      {rowActions(item)}
    </VideoCard>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <PageHeader
        title="YouTube news"
        description="Long landscape videos added from YouTube."
        actions={
          <>
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
          </>
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
    </div>
  );
};

export default Videos;