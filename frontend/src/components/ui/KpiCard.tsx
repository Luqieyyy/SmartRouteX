"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export default function KpiCard({
  label,
  value,
  subtitle,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-gray-200 p-5 flex flex-col gap-1",
        className
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="text-2xl font-semibold text-gray-900">{value}</span>
      {subtitle && (
        <span className="text-xs text-gray-400">{subtitle}</span>
      )}
    </div>
  );
}
