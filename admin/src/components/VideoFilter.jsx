import React, { useEffect, useRef } from "react";
import { X as AiOutlineClose } from "lucide-react";
import { categoryData } from "../assets/categoryData";
import { districts, findHindi, stateDistricts } from "../assets/data";

const VideoFilter = ({
  isOpen,
  onClose,
  selectedOptions,
  setSelectedOptions,
  handleSubmit,
}) => {
  const modalRef = useRef();

  const states = Object.keys(stateDistricts).map((state) => ({
    english: state,
  }));

  const handleOptionChange = (category, value) => {
    if (category === "state" || category === "district") {
      setSelectedOptions((prev) => ({
        ...prev,
        [category]: prev[category] === value ? "" : value,
      }));
    } else {
      setSelectedOptions((prev) => {
        const isSelected = prev[category].includes(value);
        return {
          ...prev,
          [category]: isSelected
            ? prev[category].filter((item) => item !== value)
            : [...prev[category], value],
        };
      });
    }
  };

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
          <h4 className="text-2xl font-semibold text-primary">Filter</h4>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 rounded-full bg-surface text-danger"
          >
            <AiOutlineClose size={22} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[35rem] p-4">
          {/* <div className="mb-4">
            <h2 className="font-semibold dark:font-medium text-lg text-primary">News Category</h2>
            <hr className="text-fg-subtle w-full mt-1" />
            <div className="flex flex-wrap mt-2">
              {categoryData.map((item, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-2 m-1 border rounded-full px-2 py-1 border-line-strong"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 p-1 text-blue bg-blue border-gray rounded-full"
                    checked={selectedOptions.news_section_type.includes(
                      item.english
                    )}
                    onChange={() =>
                      handleOptionChange("news_section_type", item.english)
                    }
                  />
                  <span>{item.hindi}</span>
                </label>
              ))}
            </div>
          </div> */}
          <div className="mb-4">
            <h2 className="font-semibold dark:font-medium text-lg text-primary">News State</h2>
            <hr className="text-fg-subtle w-full mt-1" />
            <div className="flex flex-wrap mt-2">
              {states.map((item, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-2 m-1 border rounded-full px-2 py-1 border-line-strong"
                >
                  <input
                    type="radio"
                    className="h-4 w-4 p-1 text-blue bg-blue border-gray rounded-full"
                    checked={selectedOptions.state === item.english}
                    onChange={() => handleOptionChange("state", item.english)}
                  />
                  <span>{findHindi(item.english)}</span>
                </label>
              ))}
              <label className="flex items-center space-x-2 m-1 border rounded-full px-2 py-1 border-line-strong">
                <input
                  type="radio"
                  className="h-4 w-4 p-1 text-blue bg-blue border-gray rounded-full"
                  checked={false}
                  onChange={() => handleOptionChange("state", "")}
                />
                <span>Remove</span>
              </label>
            </div>
          </div>
          <div className="mb-4">
            <h2 className="font-semibold dark:font-medium text-lg text-primary">News District</h2>
            <hr className="text-fg-subtle w-full mt-1" />
            <div className="flex flex-wrap mt-2">
              {districts.map((item, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-2 m-1 border rounded-full px-2 py-1 border-line-strong"
                >
                  <input
                    type="radio"
                    className="h-4 w-4 p-1 text-blue bg-blue border-gray rounded-full"
                    checked={selectedOptions.district === item.english}
                    onChange={() =>
                      handleOptionChange("district", item.english)
                    }
                  />
                  <span>{item.hindi}</span>
                </label>
              ))}
              <label className="flex items-center space-x-2 m-1 border rounded-full px-2 py-1 border-line-strong">
                <input
                  type="radio"
                  className="h-4 w-4 p-1 text-blue bg-blue border-gray rounded-full"
                  checked={false}
                  onChange={() => handleOptionChange("district", "")}
                />
                <span>Remove</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-semibold dark:font-medium text-lg text-primary">Location</h2>
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
            <h2 className="font-semibold dark:font-medium text-lg text-primary">Post Date</h2>

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

export default VideoFilter;
