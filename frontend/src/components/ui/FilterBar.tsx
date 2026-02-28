"use client";

import React from "react";
import { Search } from "lucide-react";
import Select from "@/components/ui/Select";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
  }[];
  actions?: React.ReactNode;
}

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  actions,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px] max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600] transition-colors"
        />
      </div>

      {/* Dropdowns */}
      {filters?.map((f) => (
        <div key={f.label} className="min-w-[140px]">
          <Select
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            options={f.options}
          />
        </div>
      ))}

      {/* Right-side actions */}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}
