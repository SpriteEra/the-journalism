import React, { useEffect, useRef } from "react";
import { X as AiOutlineClose } from "lucide-react";

const GalleryNewsFilter = ({
  isOpen,
  onClose,
  selectedOptions,
  setSelectedOptions,
  handleSubmit,
}) => {
  const modalRef = useRef();

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

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
          <div className="mb-4">
            <h2 className="font-semibold dark:font-medium text-lg text-primary">
              Location
            </h2>
            <hr className="text-fg-subtle w-full mt-1" />

            <div className="flex flex-wrap mt-2">
              <input
                type="text"
                className="p-2 border border-line-strong w-full rounded-full px-4"
                placeholder="Enter the location of news"
                value={selectedOptions.location}
                onChange={(e) =>
                  setSelectedOptions({
                    ...selectedOptions,
                    location: e.target.value,
                  })
                }
              />
            </div>
          </div>
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

export default GalleryNewsFilter;
