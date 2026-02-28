"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

  const variants: Record<string, string> = {
    primary: "bg-[#E10600] text-white hover:bg-[#B00000]",
    secondary:
      "bg-white text-[#E10600] border border-[#E10600] hover:bg-red-50",
    danger: "bg-[#B00000] text-white hover:bg-[#8B0000]",
    ghost: "text-gray-600 hover:bg-gray-100",
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
