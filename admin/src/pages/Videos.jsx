import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { History, Pencil, Plus, RotateCcw, TextSearch, Trash2, Youtube } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import httpClient from "../api/httpClient";
import { useFetchVideos } from "../hooks/ytnews";
import { formatDate } from "../utils/utils";
import SocialShare from "../components/SocialShare";
import VideoFilter from "../components/VideoFilter";
import UpdateStackPanel from "../components/UpdateStack";
import { Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, IconButton, PageHeader, Pagination, SearchInput } from "../components/ui";

const EMPTY_FILTERS = { district: [], state: [], location: "", createdAt: "", search: "" };

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

  const columns = [
    {
      key: "title",
      header: "Video",
      primary: true,
      cell: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-3">
            <img
              src={`https://img.youtube.com/vi/${item.videoLinkId}/mqdefault.jpg`}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="hindi-font line-clamp-2 font-medium text-fg">{item.title}</p>
            <p className="truncate text-xs text-fg-subtle">@{item.author?.username || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "reads",
      header: "Reads",
      cell: (item) => <span className="tabular-nums">{item.activity?.total_reads ?? 0}</span>,
    },
    {
      key: "date",
      header: "Created",
      cell: (item) => <span className="text-xs">{formatDate(item.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1">
          {item.update_stack && (
            <IconButton
              size="icon-sm"
              label="History"
              onClick={() => {
                setId(item.update_stack);
                setIsShowUpdatedStack(true);
              }}
            >
              <History className="size-4" />
            </IconButton>
          )}
          <SocialShare item={item} baseurl={`${import.meta.env.VITE_CLIENT_URL}/video/`} />
          <IconButton
            size="icon-sm"
            label="Edit"
            onClick={() => navigate(`/dashboard/videos/edit/${item.news_id}`)}
          >
            <Pencil className="size-4" />
          </IconButton>
          <IconButton
            size="icon-sm"
            label="Delete"
            className="text-danger hover:bg-danger-soft hover:text-danger"
            onClick={() => {
              setId(item.news_id);
              setIsModalOpen(true);
            }}
          >
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="YouTube news"
        description="Long landscape videos added from YouTube."
        actions={
          <Button leftIcon={Plus} onClick={() => navigate("/dashboard/videos/create")}>
            Add video
          </Button>
        }
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
          <form className="w-full xl:max-w-sm" onSubmit={handleSubmitSearch}>
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-fg-subtle">
              Total: <b className="text-fg">{data?.total ?? 0}</b>
            </span>
            <Button variant="outline" leftIcon={TextSearch} onClick={openFilter}>
              Filter
            </Button>
            <Button variant="outline" leftIcon={RotateCcw} onClick={handleResetFilter}>
              Reset
            </Button>
          </div>
        </div>

        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.news}
              loading={isPending}
              empty={
                <EmptyState
                  icon={Youtube}
                  title="No videos found"
                  description="Add a YouTube link to get started."
                />
              }
            />
            <Pagination
              page={page}
              total={data?.total || 0}
              limit={limit}
              onPage={setPage}
              onLimit={(l) => {
                setLimit(l);
                setPage(1);
              }}
              className="border-t border-line"
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
    </>
  );
};

export default Videos;