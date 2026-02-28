"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        className
      )}
    >
      {children}
    </span>
  );
}
