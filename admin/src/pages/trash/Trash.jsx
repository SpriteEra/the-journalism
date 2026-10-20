import { PageHeader as PageHeaderX } from "../../components/ui";
import { buttonStyles as buttonStylesX } from "../../components/ui/Button";
import { Link as LinkX } from "react-router-dom";
import { Plus as PlusX } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, RotateCcw, Search, TextSearch } from "lucide-react";
import { formatDate } from "../../utils/utils";
import Confirmation from "../../utils/Confirmation";
import NewsFilter from "../../components/NewsFilter";
import Pagination from "../../utils/Pagination";
import { useSearchParams } from "react-router-dom";
import { useRef } from "react";
import AsyncWrapper from "../../utils/AsyncWrapper";
import httpClient from "../../api/httpClient.js";
import toast from "react-hot-toast";
import AddLink from "../../components/AddLink.jsx";
import { useSelector } from "react-redux";
import { handleImageError } from "../../utils/imageError.js";
import { Info, User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { useFetchTrash } from "../../hooks/trash.js";
import { Trash2 } from "lucide-react";
import { Hash } from "lucide-react";
import { FileText } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Eye } from "lucide-react";
import { History } from "lucide-react";
import SlidePanel from "../../utils/SlidePannel.jsx";
import TrashItemDetailPanel from "../../components/TrashItemDetailPanel.jsx";
import UpdateStackPanel from "../../components/UpdateStack.jsx";

const Trash = () => {
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState({
    news_section_type: [],
    district: [],
    state: [],
    location: "",
    createdAt: "",
    search: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(selectedOptions);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isDetailModalOpen, setDetailIsModalOpen] = useState(false);
  const [isShowUpdatedStack, setIsShowUpdatedStack] = useState(false);
  const [isRestore, setIsRestore] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 9;
  const [search, setSearch] = useState("");
  const [id, setId] = useState(null);
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPage] = useState(pageFromUrl);
  const scrollRef = useRef(null);
  const { user } = useSelector((state) => state.user);

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

  const { data, isPending, isError, error, refetch } = useFetchTrash({
    page,
    limit: itemsPerPage,
  });

  const handleRestore = async () => {
    if (!id) return;
    let loadingToast = toast.loading("Restoring...");
    try {
      const { data } = await httpClient.delete(`/trash-restore/${id}`);
      setIsRestore(false);
      toast.dismiss(loadingToast);
      toast.success("Item Restored Successfully");
      refetch();
    } catch (err) {
      toast.dismiss(loadingToast);
      console.log(err);
      toast.error(
        err.response?.data?.message || err.message || "Something went wrong"
      );
      setIsRestore(false);
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

  return (
    <>
      <PageHeaderX title="Trash" description="Trashed items are deleted after 30 days." />
    <div className="surface-card p-3 sm:p-4">
      <div className="flex justify-between max-md:flex-col items-center gap-4 mb-2">
        <p className="text-lg text-fg">
          Trashed items will be deleted after 30 days.
        </p>

        {/* <form
          onSubmit={handleSubmitSearch}
          className="border border-line-strong bg-surface rounded-control px-2 w-full sm:w-72 flex  justify-between items-center"
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
        </form> */}

        <div className="flex gap-x-1 sm:gap-x-3 max-sm:justify-between max-sm:w-full overflow-x-auto">
          <button className="flex gap-x-1 sm:gap-x-2 items-center text-base sm:text-lg shadow p-1 rounded-sm px-1 sm:px-2 text-primary whitespace-nowrap max-sm:text-sm">
            <BookOpen size={20} />
            Total Item : {data?.count}
          </button>
          {/* <button
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
          </button> */}
        </div>
      </div>

      {/* Modified scrollable container - removed overflow-hidden that was clipping tooltips */}
      <div
        className="space-y-3 h-[calc(100vh-210px)] sm:h-[calc(100vh-230px)] md:h-[calc(100vh-220px)] overflow-y-auto overflow-x-visible p-0.5 md:p-2"
        ref={scrollRef}
      >
        <AsyncWrapper isError={isError} isPending={isPending} error={error}>
          {data?.data?.length ? (
            data?.data?.map((item, index) => (
              <div
                key={index}
                className="bg-surface rounded-lg border border-line hover:border-danger hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-4 p-2">
                  {/* Image Section */}
                  <div className="relative flex-shrink-0">
                    <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden">
                      <img
                        src={
                          item.model === "User"
                            ? item?.docId?.profile || "/avatar.png"
                            : item?.docId?.banner
                        }
                        alt={
                          item?.docId?.title ||
                          item?.docId?.fullName ||
                          "deleted item"
                        }
                        className={`w-full h-full object-cover ${
                          item.model === "User" ? "rounded-full" : ""
                        }`}
                        onError={handleImageError}
                      />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="mb-0">
                      <h3 className="text-lg font-semibold text-fg line-clamp-2 hindi-font mb-1">
                        {item.docId?.title ||
                          item.docId?.fullName ||
                          "Deleted Item"}
                      </h3>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {/* Deletion Date */}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-fg-faint" />
                        <div>
                          <span className="text-fg-subtle">
                            Deleted:
                          </span>
                          <span className="ml-1 font-medium text-fg">
                            {formatDate(item.deletedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Deleted By */}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-fg-faint" />
                        <div>
                          <span className="text-fg-subtle">
                            By:
                          </span>
                          <span className="ml-1 font-medium text-primary">
                            {item.deletedBy?.fullName ||
                              item.deletedBy?.username ||
                              item.deletedBy}
                          </span>
                        </div>
                      </div>

                      {/* News ID */}
                      {item.docId?.news_id && (
                        <div className="flex items-center gap-2 text-sm">
                          <Hash className="w-4 h-4 text-fg-faint" />
                          <div>
                            <span className="text-fg-subtle">
                              ID:
                            </span>
                            <span className="ml-1 font-mono text-xs text-fg">
                              {item.docId.news_id}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Item Type */}
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-fg-faint" />
                        <div>
                          <span className="text-fg-subtle">
                            Type:
                          </span>
                          <span className="ml-1 font-medium text-fg">
                            {item.model}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    {item.reason && (
                      <div className="bg-warning-soft border border-warning/30 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-warning mb-1">
                              DELETION REASON
                            </p>
                            <p className="text-sm text-warning">
                              {item.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="inline-flex items-center gap-2 bg-success hover:bg-success text-paper px-2.5 py-1.5 rounded text-sm font-medium transition-colors duration-200 cursor-pointer"
                        onClick={() => {
                          setId(item._id);
                          setIsRestore(true);
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </button>

                      <button
                        className="inline-flex items-center gap-2 bg-info text-paper px-2.5 py-1.5 rounded text-sm font-medium transition-colors duration-200 cursor-pointer"
                        onClick={() => {
                          setId(item._id);
                          setDetailIsModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </button>

                      {item.docId?.update_stack && (
                        <button
                          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-paper px-2.5 py-1.5 rounded text-sm font-medium transition-colors duration-200 cursor-pointer"
                          onClick={() => {
                            setId(item.docId?.update_stack);
                            setIsShowUpdatedStack(true);
                          }}
                        >
                          <History className="w-4 h-4" />
                          History
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-surface-2 rounded-full flex items-center justify-center">
                  <Trash2 className="w-12 h-12 text-fg-faint" />
                </div>
                <h3 className="text-xl font-semibold text-fg mb-2 hindi-font">
                  कोई डिलीट की गई खबर उपलब्ध नहीं है
                </h3>
                <p className="text-fg-subtle">
                  No deleted items found in trash
                </p>
              </div>
            </div>
          )}
        </AsyncWrapper>
      </div>

      <div className="flex justify-between mt-4">
        <Pagination
          totalItems={data?.count}
          itemsPerPage={itemsPerPage}
          defaultCurrent={1}
          current={page}
          onChange={(val) => setPage(val)}
          isLoading={isPending}
        />
      </div>

      <Confirmation
        isOpen={isRestore}
        onClose={() => setIsRestore(false)}
        onConfirm={handleRestore}
        btnTitle="Restore"
        title="Are you sure?"
        description="Are you sure you want to restore this item? This action cannot be undone."
      />
      <NewsFilter
        handleSubmit={handleSubmit}
        setSelectedOptions={setSelectedOptions}
        selectedOptions={selectedOptions}
        isOpen={isFilterOpen}
        onClose={closeFilter}
      />
      <TrashItemDetailPanel
        docId={id}
        isOpen={isDetailModalOpen}
        onClose={() => setDetailIsModalOpen(false)}
        title="User Details"
        width="400px"
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

export default Trash;
