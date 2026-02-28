"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium text-gray-600 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600] transition-colors",
            error && "border-red-400",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
