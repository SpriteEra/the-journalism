import React from "react";
import Loader from "../components/Loader";

const AsyncWrapper = ({ isPending, isError, error, children }) => {
  if (isPending) {
    return (
      <div className="items-center justify-center py-4 flex flex-1 h-full">
        <Loader/>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-danger text-center py-4">
        {error?.message || "Something went wrong."}
      </div>
    );
  }

  return <>{children}</>;
};

export default AsyncWrapper;
