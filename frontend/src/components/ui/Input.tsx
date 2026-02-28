"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-gray-600 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600] transition-colors",
            error && "border-red-400",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
