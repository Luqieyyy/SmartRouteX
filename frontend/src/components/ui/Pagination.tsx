"use client";

import React from "react";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  lastPage,
  onPageChange,
}: PaginationProps) {
  if (lastPage <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= lastPage; i++) {
    if (
      i === 1 ||
      i === lastPage ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center gap-1 mt-4">
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        Prev
      </button>
      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`dots-${idx}`} className="px-2 text-xs text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-xs border transition-colors ${
              p === currentPage
                ? "bg-[#E10600] text-white border-[#E10600]"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={currentPage >= lastPage}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
}
