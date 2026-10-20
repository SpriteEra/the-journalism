import { PageHeader as PageHeaderX } from "../../components/ui";
import { buttonStyles as buttonStylesX } from "../../components/ui/Button";
import { Link as LinkX } from "react-router-dom";
import { Plus as PlusX } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFetchEventNews, useFetchNews } from "../../hooks/news";
import { BookOpen, Plus, RotateCcw, Search, TextSearch } from "lucide-react";
import { formatDate } from "../../utils/utils";
import SocialShare from "../../components/SocialShare";
import Confirmation from "../../utils/Confirmation";
import Pagination from "../../utils/Pagination";
import { useSearchParams } from "react-router-dom";
import { useRef } from "react";
import AsyncWrapper from "../../utils/AsyncWrapper";
import httpClient from "../../api/httpClient.js";
import toast from "react-hot-toast";
import EventNewsFilter from "../../components/EventNewsFilter.jsx";
import AddButton from "../../components/AddLink.jsx";
import { handleImageError } from "../../utils/imageError.js";
import {
  useFetchActiveEvent,
  useFetchEventNewsByAdmin,
} from "../../hooks/event.js";
const EventNews = () => {
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState({
    location: "",
    createdAt: "",
    type: "all",
    search: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(selectedOptions);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 10;
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [id, setId] = useState(null);
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPage] = useState(pageFromUrl);
  const scrollRef = useRef(null);

  const openFilter = () => {
    setIsFilterOpen(true);
    // document.body.style.overflow = "hidden"; // Disable scroll
  };

  const closeFilter = () => {
    setIsFilterOpen(false);
    // document.body.style.overflow = "auto"; // Enable scroll
  };

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    // if (e.key === "Enter") {
    //   setSelectedOptions((prevOptions) => ({
    //     ...prevOptions,
    //     search: e.target.value,
    //   }));
    // }
    setAppliedFilters({
      ...selectedOptions,
      search: search,
    });
  };
  const handleSubmit = () => {
    setAppliedFilters(selectedOptions);
  };
  const { id: category_id } = useParams();

  const { data, isPending, isError, error, refetch } = useFetchEventNewsByAdmin(
    {
      page,
      limit: itemsPerPage,
      draft: false,
      filters: appliedFilters,
      category_id,
    }
  );

  const { data: activeEvent } = useFetchActiveEvent();

  const handleDelete = async () => {
    if (!id) return toast.error("Please try again");
    setIsDeleting(true);
    try {
      let loadingToast = toast.loading("Deleting...");
      const { data } = await httpClient.delete(`/delete-event-news/${id}`);
      setIsModalOpen(false);
      toast.dismiss(loadingToast);
      toast.success("News Deleted Successfully");
      setIsDeleting(false);
      refetch();
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete news");
      setIsModalOpen(false);
      setIsDeleting(false);
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
    // fetchNews({ page: 1, findCount: true });
  };

  useEffect(() => {
    setSearchParams({ page });
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" }); // 👈 scroll div to top
    }
  }, [page]);

  return (
    <>
      <PageHeaderX title="Event news" description="Stories of this event category." actions={(activeEvent && activeEvent?._id === category_id) ? <LinkX to="/dashboard/events/create" className={buttonStylesX({})}><PlusX className="size-4" />Add event news</LinkX> : null} />
    <div className="surface-card p-3 sm:p-4">
      <div className="flex justify-between max-md:flex-col items-center gap-4 mb-2">
        <form
          onSubmit={handleSubmitSearch}
          className="border border-line-strong bg-surface rounded-control px-2 w-full sm:w-72 flex  justify-between items-center"
        >
          <input
            type="text"
            placeholder="Search News"
            // onKeyDown={handleSubmitSearch}
            // onSubmit={handleSubmitSearch}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="border-none outline-none bg-transparent max-sm:p-1 p-1.5 rounded flex-1 min-w-0"
          />
          <Search size={25} className="max-sm:pr-1 p-1" />
        </form>

        <div className="flex gap-x-1 sm:gap-x-3 max-sm:justify-between max-sm:w-full overflow-x-auto">
          <button className="flex gap-x-1 sm:gap-x-2 items-center text-base sm:text-lg shadow p-1 rounded-sm px-1 sm:px-2 text-primary whitespace-nowrap ">
            <BookOpen size={20} />
            Total News : {data?.total}
          </button>
          <button
            className="flex gap-x-1 sm:gap-x-2 items-center text-base sm:text-lg shadow p-1 rounded-sm px-1 sm:px-2 text-primary cursor-pointer whitespace-nowrap "
            onClick={handleResetFilter}
          >
            <RotateCcw size={20} />
            Reset Filter
          </button>
          <button
            className="flex gap-x-1 sm:gap-x-2 items-center text-base sm:text-lg shadow p-1 rounded-sm px-1 sm:px-2 text-primary cursor-pointer whitespace-nowrap "
            onClick={openFilter}
          >
            <TextSearch size={25} /> Filter
          </button>
        </div>
      </div>
      <div
        className="space-y-3 h-[calc(100vh-210px)] sm:h-[calc(100vh-230px)] md:h-[calc(100vh-220px)] overflow-auto p-0.5 md:p-2"
        ref={scrollRef}
      >
        <AsyncWrapper isError={isError} isPending={isPending} error={error}>
          {data?.news?.length ? (
            data?.news?.map((item, index) => (
              <div
                key={index}
                className="grid sm:grid-cols-7 lg:grid-cols-6 gap-2 items-center p-1 max-sm:pb-2 sm:p-2 rounded shadow-card dark:border-b"
                // style={{boxShadow: `rgba(100, 100, 111, 0.2) 0px 7px 29px 0px`}}
              >
                <div className="sm:col-span-2 lg:col-span-1">
                  <img
                    src={`${item?.banner}?q=75&w=300`}
                    alt="news"
                    className="w-full h-36 sm:h-24 object-cover"
                    onError={handleImageError}
                  />
                </div>
                <div className="sm:col-span-5 lg:col-span-5">
                  <div className="flex-1">
                    <h3 className="text-lg line-clamp-2 sm:line-clamp-1 hindi-font font-semibold text-fg dark:font-medium">
                      {item.title}
                    </h3>
                    <div className="flex max-sm:flex-col justify-start gap-y-1 gap-x-3 lg:gap-x-8">
                      <p className="text-[16px] text-fg-subtle">
                        <span className="text-fg">
                          Created On:
                        </span>{" "}
                        {formatDate(item.createdAt)}
                      </p>
                      <p className="text-lg text-fg-subtle">
                        <span className="font-light text-fg">
                          Read:
                        </span>{" "}
                        {item.activity?.total_reads}
                      </p>
                      <p className="text-lg text-gray">
                        <span className="text-fg">
                          Reporter
                        </span>
                        <Link className="text-primary border-b border-blue ml-2 font-light">
                          @{item?.author?.username}
                        </Link>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-1">
                    <button
                      className="bg-primary  text-paper px-3 py-0.5 rounded text-base cursor-pointer"
                      onClick={() =>
                        navigate(`/dashboard/events/edit/${item?.news_id}`)
                      }
                    >
                      Edit
                    </button>

                    <SocialShare item={item} />

                    <button
                      className="bg-danger text-paper px-3 py-0.5 rounded text-base cursor-pointer"
                      onClick={() => {
                        setIsModalOpen(true);
                        setId(item?.news_id);
                      }}
                    >
                      Delete
                    </button>
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

      <Confirmation
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        btnTitle="Delete"
        title="Are you sure?"
        btnDanger={true}
        description="Are you sure you want to delete this item? This action cannot be undone."
      />
      <EventNewsFilter
        handleSubmit={handleSubmit}
        setSelectedOptions={setSelectedOptions}
        selectedOptions={selectedOptions}
        isOpen={isFilterOpen}
        onClose={closeFilter}
      />
    </div>
    </>
  );
};

export default EventNews;
