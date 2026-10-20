import React from "react";
import { Calendar, Plus, Clock, Trash, PlusCircle } from "lucide-react";
import { useState } from "react";
import PopUp from "../../utils/PopUp";
import AddNewEventCategory from "../../components/event/AddNewEventCategory";
import { useFetchEventCategory } from "../../hooks/event";
import AsyncWrapper from "../../utils/AsyncWrapper";
import { useNavigate } from "react-router-dom";
import UpdateEventCategory from "../../components/event/UpdateEventCategory";
import DeleteEventCategory from "../../components/event/DeleteEventCategory";
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "bg-success";
    case "upcoming":
      return "bg-primary";
    case "draft":
      return "bg-warning";
    default:
      return "bg-fg-faint";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "active":
      return "LIVE";
    case "upcoming":
      return "UPCOMING";
    case "ended":
      return "ENDED";
    default:
      return "UNKNOWN";
  }
};
export default function AdminEvent() {
  const [isAddNewCategory, setIsAddNewCategory] = useState(false);
  const [isEditCategory, setIsEditCategory] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [category, setCategory] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const { data, isPending, isError, error, refetch } = useFetchEventCategory();

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-2 to-surface-2 p-6 transition-colors duration-300  rounded-md">
      <AsyncWrapper isError={isError} error={error} isPending={isPending}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-fg mb-2">
                Event News
              </h1>
            </div>

            {/* Add New Button */}
            <button
              className="bg-primary hover:bg-primary-hover text-paper px-5 py-2 rounded-md font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              onClick={() => setIsAddNewCategory(true)}
            >
              <Plus className="w-5 h-5 dark:hidden" />
              Add New
            </button>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data && data.length ? (
              data.map((event) => (
                <div
                  key={event._id}
                  className="mx-auto p-2 sm:p-4 bg-surface rounded-lg sm:rounded-2xl shadow-lg hover:shadow-xl dark:shadow-2xl border border-line transition-all duration-300 transform hover:-translate-y-1 w-full"
                >
                  {/* Status Indicator */}
                  <div className="flex justify-between items-center mb-1 sm:mb-4">
                    <div className="flex gap-1 items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(
                          event.status
                        )}`}
                      ></div>
                      <div className="text-xs text-fg-faint font-medium">
                        {getStatusText(event.status)}
                      </div>
                    </div>
                    <button
                      className="text-danger hover:text-paper hover:bg-danger p-2 rounded-full transition duration-200 cursor-pointer"
                      onClick={() => {
                        setIsDelete(true), setDeleteItem(event);
                      }}
                    >
                      <Trash />
                    </button>
                  </div>

                  {/* Event Content */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-fg line-clamp-1 capitalize">
                      {event.title?.replace(/-/g, " ")}
                    </h3>

                    <h2 className="font-medium text-fg line-clamp-1">
                      {event.title_hindi}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-fg-muted line-clamp-2">
                      {event.description}
                    </p>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 text-fg-muted">
                      <Calendar className="w-4 h-4 dark:hidden" />
                      <span className="text-sm font-medium">
                        {formatDate(event.start_date)} -{" "}
                        {formatDate(event.end_date)}
                      </span>
                    </div>

                    {/* Created By */}
                    <div className="flex items-center gap-2 text-fg-subtle">
                      <div className="w-6 h-6 bg-primary-soft rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {event.createdBy?.username.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs">
                        by {event.createdBy?.username}
                      </span>
                    </div>

                    {/* Action Button */}
                    <div className="flex gap-2 mt-2 sm:mt-4">
                      <button
                        className="w-full bg-surface-2 hover:bg-surface-2 text-fg-muted py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-colors duration-200 "
                        onClick={() => {
                          setIsEditCategory(true), setCategory(event);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="w-full bg-surface-2 hover:bg-surface-2 text-fg-muted py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-colors duration-200 "
                        onClick={() =>
                          navigate(`/dashboard/admin-events/${event._id}`)
                        }
                      >
                        View News
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="mt-12 text-center">
                <div className="mx-auto p-1 sm:p-12 bg-surface rounded-2xl shadow-lg dark:shadow-2xl border-2 border-dashed border-line transition-colors duration-300">
                  <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PlusCircle className="w-8 h-8 text-fg-faint dark:hidden" />
                  </div>
                  <h3 className="text-xl font-semibold text-fg mb-2">
                    No more events
                  </h3>
                  <p className="text-fg-subtle mb-6">
                    Add new events to keep your audience engaged
                  </p>
                  <button
                    className="bg-primary hover:bg-primary-hover text-paper px-3 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl sm:font-semibold transition-colors duration-200"
                    onClick={() => setIsAddNewCategory(true)}
                  >
                    Create Event
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Empty State for More Events */}
        </div>
        <PopUp
          isOpen={isEditCategory}
          onClose={() => setIsEditCategory(false)}
          heading="Edit Category"
        >
          <UpdateEventCategory
            event={category}
            setIsEditCategory={setIsEditCategory}
            refetch={refetch}
          />
        </PopUp>
        <PopUp
          isOpen={isDelete}
          onClose={() => setIsDelete(false)}
          heading="Delete Category"
        >
          <DeleteEventCategory
            event={deleteItem}
            setIsDelete={setIsDelete}
            refetch={refetch}
          />
        </PopUp>
        <PopUp
          isOpen={isAddNewCategory}
          onClose={() => setIsAddNewCategory(false)}
          heading="New Event Category"
        >
          <AddNewEventCategory
            setIsAddNewCategory={setIsAddNewCategory}
            refetch={refetch}
          />
        </PopUp>
      </AsyncWrapper>
    </div>
  );
}
