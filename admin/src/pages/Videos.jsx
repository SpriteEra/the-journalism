import { PageHeader as PageHeaderX } from "../components/ui";
import { buttonStyles as buttonStylesX } from "../components/ui/Button";
import { Link as LinkX } from "react-router-dom";
import { Plus as PlusX } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Plus, RotateCcw, Search, TextSearch } from "lucide-react";
import { formatDate } from "../utils/utils";
import SocialShare from "../components/SocialShare";
import Confirmation from "../utils/Confirmation";
import Pagination from "../utils/Pagination";
import { useSearchParams } from "react-router-dom";
import { useRef } from "react";
import AsyncWrapper from "../utils/AsyncWrapper";
import { useFetchVideos } from "../hooks/ytnews";
import VideoFilter from "../components/VideoFilter";
import httpClient from "../api/httpClient";
import toast from "react-hot-toast";
import AddLink from "../components/AddLink";
import UpdateStackPanel from "../components/UpdateStack";
import { useQueryClient } from "@tanstack/react-query";

const Videos = () => {
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState({
    district: [],
    state: [],
    location: "",
    createdAt: "",
    search: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(selectedOptions);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 10;
  const [search, setSearch] = useState("");
  const [id, setId] = useState(null);
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
  const [isShowUpdatedStack, setIsShowUpdatedStack] = useState(false);

  const [page, setPage] = useState(pageFromUrl);
  const scrollRef = useRef(null);

  const openFilter = () => {
    setIsFilterOpen(true);
  };

  const closeFilter = () => {
    setIsFilterOpen(false);
  };

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    setAppliedFilters({
      ...selectedOptions,
      search: search,
    });
  };

  const handleSubmit = () => {
    setAppliedFilters(selectedOptions);
  };
  const queryClient = useQueryClient();
  const { data, isPending, isError, error } = useFetchVideos({
    page,
    limit: itemsPerPage,
    filters: appliedFilters,
  });

  // Check if pagination should be shown
  const showPagination = data?.total > itemsPerPage && !isPending;

  const handleDelete = async () => {
    if (isDeleting) return;
    if (!id) return toast.error("Please try again");
    let loadingToast = toast.loading("Deleting...");
    try {
      setIsDeleting(true);
      await httpClient.delete(`delete-yt-news/${id}`);
      setIsModalOpen(false);
      setIsDeleting(false);
      toast.dismiss(loadingToast);
      toast.success("News Deleted Successfully");
      queryClient.invalidateQueries({
        queryKey: ["yt-news"],
      });
    } catch (err) {
      toast.dismiss(loadingToast);
      console.log(err);
      setIsDeleting(false);
      toast.error("Failed to delete news");
      setIsModalOpen(false);
    }
  };

  const handleResetFilter = () => {
    setAppliedFilters({
      news_section_type: [],
      district: [],
      state: [],
      location: "",
      createdAt: "",
      search: "",
    });
  };

  useEffect(() => {
    setSearchParams({ page });
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  // Dynamic height calculation based on pagination visibility
  const getContentHeight = () => {
    if (showPagination) {
      return "h-[calc(100vh-210px)] sm:h-[calc(100vh-230px)] md:h-[calc(100vh-220px)]";
    } else {
      // When no pagination, take more height (subtract pagination height ~60px)
      return "h-[calc(100vh-150px)] sm:h-[calc(100vh-170px)] md:h-[calc(100vh-160px)]";
    }
  };

  return (
    <>
      <PageHeaderX title="YouTube news" description="Long landscape videos added from YouTube." actions={<LinkX to="/dashboard/videos/create" className={buttonStylesX({})}><PlusX className="size-4" />Add video</LinkX>} />
    <div className="surface-card p-3 sm:p-4">

      <div className="flex justify-between max-md:flex-col items-center gap-4 mb-2">
        <form
          onSubmit={handleSubmitSearch}
          className="border border-line-strong bg-surface rounded-control px-2 w-full sm:w-72 flex justify-between items-center"
        >
          <input
            type="text"
            placeholder="Search News"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="border-none outline-none bg-transparent max-sm:p-1 p-1.5 rounded flex-1 min-w-0"
          />
          <Search size={25} className="max-sm:pr-1 p-1" />
        </form>

        <div className="flex gap-x-1 sm:gap-x-3 max-sm:justify-between max-sm:w-full overflow-x-auto">
          <button className="flex gap-x-1 sm:gap-x-2 items-center text-base sm:text-lg shadow p-1 rounded-sm px-1 sm:px-2 text-primary whitespace-nowrap max-sm:text-sm">
            <BookOpen size={20} />
            Total News : {data?.total}
          </button>
          <button
            className="flex gap-x-1 sm:gap-x-2 items-center text-base sm:text-lg shadow p-1 rounded-sm px-1 sm:px-2 text-primary cursor-pointer whitespace-nowrap max-sm:text-sm"
            onClick={handleResetFilter}
          >
            <RotateCcw size={20} />
            Reset Filter
          </button>
          <button
            className="flex gap-x-1 sm:gap-x-2 items-center text-base sm:text-lg shadow p-1 rounded-sm px-1 sm:px-2 text-primary cursor-pointer whitespace-nowrap max-sm:text-sm"
            onClick={openFilter}
          >
            <TextSearch size={25} /> Filter
          </button>
        </div>
      </div>

      <div
        className={`space-y-3 ${getContentHeight()} overflow-auto p-0.5 md:p-2`}
        ref={scrollRef}
      >
        <AsyncWrapper isError={isError} isPending={isPending} error={error}>
          {data?.news?.length ? (
            data?.news?.map((item, index) => (
              <div
                key={index}
                className="grid sm:grid-cols-7 lg:grid-cols-6 gap-2 items-center p-1 max-sm:pb-2 sm:p-2 rounded shadow-card dark:border-b"
              >
                <div className="sm:col-span-2 lg:col-span-1">
                  <img
                    src={`https://img.youtube.com/vi/${item?.videoLinkId}/mqdefault.jpg`}
                    alt="news"
                    className="w-full h-36 sm:h-24 object-cover"
                  />
                </div>
                <div className="sm:col-span-5 lg:col-span-5">
                  <div className="flex-1">
                    <h3 className="sm:text-lg line-clamp-2 sm:line-clamp-1 hindi-font font-semibold text-fg dark:font-medium">
                      {item.title}
                    </h3>
                    <div className="flex max-sm:flex-col justify-start gap-y-1 gap-x-3 lg:gap-x-8">
                      <p className="text-sm sm:text-[16px] text-fg-subtle">
                        <span className="text-fg">
                          Created On:
                        </span>{" "}
                        {formatDate(item.createdAt)}
                      </p>
                      <p className="text-sm sm:text-[16px] text-fg-subtle">
                        <span className="font-light text-fg">
                          Read:
                        </span>{" "}
                        {item.activity?.total_reads}
                      </p>
                      <p className="text-sm sm:text-[16px] text-fg-subtle">
                        <span className="text-fg">
                          Reporter
                        </span>
                        <Link className="text-primary border-b border-blue ml-2 font-light">
                          @{item?.author?.username}
                        </Link>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-4 mt-2 sm:mt-1">
                    <button
                      className="bg-primary text-paper px-3 py-0.5 rounded text-base cursor-pointer"
                      onClick={() =>
                        navigate(`/dashboard/videos/edit/${item?.news_id}`)
                      }
                    >
                      Edit
                    </button>

                    <SocialShare
                      item={item}
                      baseurl={`${import.meta.env.VITE_CLIENT_URL}/video/`}
                    />

                    <button
                      className="bg-danger text-paper px-3 py-0.5 rounded text-base cursor-pointer"
                      onClick={() => {
                        setIsModalOpen(true);
                        setId(item?.news_id);
                      }}
                    >
                      Delete
                    </button>
                    {item?.update_stack && (
                      <button
                        className="bg-primary hover:bg-primary-hover text-paper px-3 py-0.5 rounded text-base cursor-pointer"
                        onClick={() => {
                          setId(item?.update_stack);
                          setIsShowUpdatedStack(true);
                        }}
                      >
                        History
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center h-full">
              <h5 className="text-3xl text-fg-muted hindi-font">
                कोई खबर उपलब्ध नहीं है
              </h5>
            </div>
          )}
        </AsyncWrapper>
      </div>

      {/* Conditionally render pagination */}
      {showPagination && (
        <div className="flex justify-between mt-4">
          <Pagination
            totalItems={data?.total}
            itemsPerPage={itemsPerPage}
            defaultCurrent={1}
            current={page}
            onChange={(val) => setPage(val)}
            isLoading={isPending}
          />
        </div>
      )}

      <Confirmation
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        btnTitle="Delete"
        title="Are you sure?"
        btnDanger={true}
        description="Are you sure you want to delete this item? This action cannot be undone."
      />
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
    </>
  );
};

export default Videos;
