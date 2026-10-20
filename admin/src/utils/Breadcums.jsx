import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight as FaChevronRight } from "lucide-react";

const Breadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathnames = location.pathname.split("/").filter(Boolean);

  // If path is exactly /dashboard, don't show extra breadcrumb
  const isOnlyDashboard =
    pathnames.length === 1 && pathnames[0] === "dashboard";

  const handleNavigate = (to) => {
    navigate(to);
  };

  const generatePath = (index) => {
    return "/" + pathnames.slice(0, index + 1).join("/");
  };

  return (
    <nav className="flex items-center text-[16px] text-fg-muted">
      <button
        onClick={() => navigate("/dashboard")}
        className="text-info hover:underline font-medium"
      >
        Dashboard
      </button>

      {!isOnlyDashboard &&
        pathnames.map((segment, index) => (
          <div key={index} className="flex items-center space-x-2">
            <FaChevronRight className="mx-2 text-fg-faint text-xs" />
            {index === pathnames.length - 1 ? (
              <span className="capitalize font-semibold text-fg">
                {decodeURIComponent(segment).replaceAll("-", " ")}
              </span>
            ) : (
              <button
                onClick={() => handleNavigate(generatePath(index))}
                className="text-info hover:underline capitalize font-medium"
              >
                {decodeURIComponent(segment)}
              </button>
            )}
          </div>
        ))}
    </nav>
  );
};

export default Breadcrumbs;
