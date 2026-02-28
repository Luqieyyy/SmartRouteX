"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ── Column Definition ── */
export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

/* ── Props ── */
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
  columns,
  data,
  keyField = "id" as keyof T,
  loading,
  emptyMessage = "No records found.",
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-gray-400"
              >
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={String((row as Record<string, unknown>)[keyField as string] ?? rowIdx)}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 text-gray-700", col.className)}>
                    {col.render
                      ? col.render(row)
                      : ((row as Record<string, unknown>)[col.key] as React.ReactNode) ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
