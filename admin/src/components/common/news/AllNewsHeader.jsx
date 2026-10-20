import React from "react";
import { Search as BsSearch } from "lucide-react";
import { RotateCcw as GrPowerReset } from "lucide-react";
import { ScanSearch as MdOutlineManageSearch } from "lucide-react";

const AllNewsHeader = ({
  handleSubmitSearch,
  handleResetFilter,
  openFilter,
}) => {
  return (
    <div className="flex justify-between max-sm:flex-col items-center gap-4 mb-2">
      <div className="border-2 rounded-lg w-full sm:w-60 flex  justify-between items-center">
        <input
          type="text"
          placeholder="Search News"
          onKeyDown={handleSubmitSearch}
          className="border-none outline-none max-sm:p-2 p-1 rounded-lg"
        />
        <BsSearch size={25} className="max-sm:pr-1" />
      </div>

      <div className="flex gap-x-3 max-sm:justify-between max-sm:w-full">
        <button
          className="flex gap-x-2 items-center text-2xl shadow-regular-shadow p-2 rounded-md px-3 text-blue font-semibold"
          onClick={() => handleResetFilter()}
        >
          <GrPowerReset size={20} />
          Reset Filter
        </button>
        <button
          className="flex gap-x-2 items-center text-2xl shadow-regular-shadow p-2 rounded-md px-3 text-blue font-semibold"
          onClick={openFilter}
        >
          <MdOutlineManageSearch size={25} /> Filter
        </button>
      </div>
    </div>
  );
};

export default AllNewsHeader;
