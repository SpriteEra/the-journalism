import React, { useState, useEffect } from "react";
import CustomDropdown from "./CustomeDropDown";
import { X as CloseIcon } from "lucide-react";

const SchedulePopUp = ({
  popupOpen,
  setPopUpOpen,
  handleSchedule,
  post_time,
  handleTimeChange,
  handleDateChange,
  selectedTimeIndex,
  timeOptions,
}) => {
  const timeToIndexMap = timeOptions.reduce((acc, time, index) => {
    acc[time] = index; // Use the full time string as the key
    return acc;
  }, {});


  const [dateValue, setDateValue] = useState(
    post_time?.date || new Date().toISOString().split("T")[0]
  );

  const [timeIndex, setTimeIndex] = useState(selectedTimeIndex);

  useEffect(() => {
    if (post_time?.date) {
      const date = new Date(post_time?.date).toISOString().split("T")[0];
      setDateValue(date);
    }
    setTimeIndex(
      timeToIndexMap[post_time?.time] !== undefined
        ? timeToIndexMap[post_time?.time]
        : selectedTimeIndex
    );
  }, [popupOpen]);

  const handleNewDateChange = (e) => {
    setDateValue(e.target.value);
    handleDateChange(e.target.value);
  };

  const handleTimeChangeInternal = (index) => {
    setTimeIndex(index);
    handleTimeChange(index);
  };

  if (!popupOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (e.target.className.includes("disable")) {
      return;
    }
    e.target.classList.add("disable");
    handleSchedule();
    e.target.classList.remove("disable");
  };

  return (
    <div className="fixed inset-0 bg-ink/50 flex justify-center items-center z-[1000]">
      <div className="bg-surface w-full max-w-lg mx-2 md:mx-4 lg:mx-6 rounded-lg relative p-10 min-h-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Schedule post</h2>
          <button
            onClick={() => setPopUpOpen(false)}
            className="text-fg-faint hover:text-paper"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

           <div className="mb-4">
            <label className="block text-fg-muted mb-2">Date</label>
            <input
              type="date"
              value={dateValue}
              onChange={handleNewDateChange}
              min={new Date().toISOString().split("T")[0]} // Restrict past dates
              className="w-full p-2 bg-surface-2 text-fg rounded border border-line-strong"
            />
          </div>

          <div className="mb-4">
            <label className="block text-fg-muted mb-2">Time</label>
            <CustomDropdown
              options={timeOptions}
              selectedOption={timeIndex}
              onSelectOption={handleTimeChangeInternal}
            />
          </div>

          <div className="flex justify-between mt-10">
            <button
              type="button"
              onClick={() => setPopUpOpen(false)}
              className="btn-blue-outline"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="btn-blue"
            >
              Schedule
            </button>
          </div>
      </div>
    </div>
  );
};

export default SchedulePopUp;
