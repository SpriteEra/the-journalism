import React, { isValidElement } from "react";
import { cn } from "../lib/cn";
import { Skeleton } from "../components/ui/Feedback";

/**
 * Legacy table API (headRow / data / children render-function) – restyled with tokens.
 * New screens should use <DataTable columns rows /> which also turns rows into cards on phones.
 */
const Table = ({
  headRow = [], data = [], isLoading = false, skeletonRows = 6,
  theadClass = "", tbodyClasses = "", tableClass = "", thClass = "", tdClass = "", trHeadClass = "",
  noDataText = "No data available", children,
}) => {
  const renderRows = () => {
    if (isLoading) {
      return Array.from({ length: skeletonRows }).map((_, r) => (
        <tr key={r} className="border-b border-line">
          {headRow.map((_, c) => <td key={c} className={cn("px-4 py-4", tdClass)}><Skeleton className="h-4 w-full max-w-40" /></td>)}
        </tr>
      ));
    }
    if (!data.length) {
      return <tr><td colSpan={headRow.length} className="h-48 px-4 py-4 text-center align-middle text-fg-subtle">{noDataText}</td></tr>;
    }
    return data.map((rowData, index) => {
      if (typeof children === "function") return children(rowData, index);
      if (isValidElement(children)) return React.cloneElement(children, { key: index, ...rowData });
      return null;
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-x-auto">
      <table className={cn("w-full min-w-[500px] table-auto border-collapse text-sm text-fg-muted [&_tbody_tr]:border-b [&_tbody_tr]:border-line [&_tbody_tr:hover]:bg-surface-2/60 [&_tbody_td]:px-4 [&_tbody_td]:py-3", tableClass)}>
        <thead className={cn("sticky top-0 z-10 bg-surface-2", theadClass)}>
          <tr className={trHeadClass}>
            {headRow.map((header, index) => (
              <th key={index} className={cn("whitespace-nowrap border-b border-line px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-fg-subtle", thClass)}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className={tbodyClasses}>{renderRows()}</tbody>
      </table>
    </div>
  );
};

export default Table;
