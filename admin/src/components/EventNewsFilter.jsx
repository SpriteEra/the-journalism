import React, { useEffect, useRef } from "react";
import { X as AiOutlineClose } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useFetchEventCategories } from "../hooks/event";

const EventNewsFilter = ({
  isOpen,
  onClose,
  selectedOptions,
  setSelectedOptions,
  handleSubmit,
}) => {
  const modalRef = useRef();
  const { isPending, isError, data } = useFetchEventCategories();

  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setSelectedOptions((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-ink/50 flex justify-center items-center z-[1000]">
      <div
        ref={modalRef}
        className="bg-surface w-full max-w-lg mx-2 md:mx-4 lg:mx-6 rounded-lg "
      >
        <div className="flex justify-between px-3 pt-2 shadow-regular-shadow">
          <h4 className="text-2xl font-semibold text-primary">
            Filter
          </h4>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 rounded-full bg-surface text-danger"
          >
            <AiOutlineClose size={22} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[35rem] p-4">
          {user && user.role === "admin" && data && data.length && (
            <div className="flex flex-col gap-y-1">
              <label className="text-xl font-medium text-primary required-text dark:font-medium">
                Choose the event type{" "}
              </label>
              <select
                name="type"
                value={selectedOptions.type}
                onChange={handleOptionChange}
                className="input-box mb-5 pl-4 capitalize dark:appearance-none"
              >
                <option value="" disabled>
                  Select Event Type
                </option>
                <option value={"all"} className="capitalize">
                  {"All Events"}
                </option>
                {data &&
                  data?.map((event, i) => (
                    <option key={i} value={event._id} className="capitalize">
                      {event.title_hindi}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div className="mt-2">
            <h2 className="font-semibold dark:font-medium text-lg text-primary">
              Post Date
            </h2>

            {/* <CustomDatePicker
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
            /> */}
            <input
              type="date"
              className="p-2 border border-line-strong w-full rounded-full px-4"
              value={selectedOptions.createdAt}
              onChange={(e) =>
                setSelectedOptions({
                  ...selectedOptions,
                  createdAt: e.target.value,
                })
              }
            />
          </div>
        </div>
        <div className="shadow-card p-2 flex justify-between">
          <div className="btn-outline bg-transparent">
            Cancel
          </div>
          <button
            className="btn-blue"
            onClick={() => {
              handleSubmit();
              onClose();
            }}
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventNewsFilter;
