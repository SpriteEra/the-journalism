import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight as FaChevronRight } from "lucide-react";
import { truncate } from "./utils";

const Breadcrumbs1 = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathnames = location.pathname.split("/").filter(Boolean);

  const handleNavigate = (to) => {
    navigate(to);
  };

  const generatePath = (index) => {
    return "/" + pathnames.slice(0, index + 1).join("/");
  };

  if (pathnames.length === 0) return null; // Don't show anything for root (/)

  return (
    <nav className="flex items-center text-[16px] text-fg-muted">
      {pathnames.map((segment, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index !== 0 && (
            <FaChevronRight className="mx-2 text-fg-faint text-xs" />
          )}
          {index === pathnames.length - 1 ? (
            <span className="capitalize font-semibold text-fg">
              {truncate(decodeURIComponent(segment).replaceAll("-", " "), 25)}
            </span>
          ) : (
            <button
              onClick={() => handleNavigate(generatePath(index))}
              className="text-primary dark:font-normal hover:underline capitalize font-medium"
            >
              {truncate(decodeURIComponent(segment).replaceAll("-", " "), 25)}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs1;
