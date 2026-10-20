import { useEffect, useState } from "react";
import UiPagination from "../components/ui/Pagination";
import { Skeleton } from "../components/ui/Feedback";
import { cn } from "../lib/cn";

/** Legacy API (totalItems / itemsPerPage / current / onChange(page)) over the new <Pagination>. */
const Pagination = ({ totalItems = 0, itemsPerPage = 10, defaultCurrent, current, onChange, position = "center", classes = "", isLoading = false }) => {
  const [page, setPage] = useState(current || defaultCurrent || 1);
  useEffect(() => { if (current) setPage(current); }, [current]);
  const pages = Math.ceil(totalItems / itemsPerPage);

  if (isLoading) return <div className="flex justify-center p-4"><Skeleton className="h-8 w-64" /></div>;
  if (pages <= 1) return null;
  return (
    <UiPagination
      page={page}
      total={totalItems}
      limit={itemsPerPage}
      onPage={(p) => { setPage(p); onChange?.(p); }}
      className={cn(position === "left" && "justify-start", classes)}
    />
  );
};

export default Pagination;
