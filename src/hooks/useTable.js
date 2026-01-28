import { useState } from "react";

export const useTable = (data, pageSize = 5) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const sortedData = sortColumn
    ? [...data].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      })
    : data;

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const pageData = sortedData.slice(startIdx, startIdx + pageSize);

  return {
    pageData,
    currentPage,
    totalPages,
    setCurrentPage,
    sortColumn,
    setSortColumn,
    sortOrder,
    setSortOrder,
  };
};

export default useTable;
