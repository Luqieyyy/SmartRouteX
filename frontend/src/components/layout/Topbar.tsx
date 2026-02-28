"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";

export default function Topbar() {
  const [now, setNow] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleString("en-MY", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Left — page context or breadcrumb slot */}
      <div>
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          Operations Dashboard
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        {/* Clock */}
        <span className="text-xs text-gray-500 tabular-nums">{now}</span>

        {/* Profile */}
        <div className="relative">
          <button
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            onClick={() => setOpen(!open)}
          >
            <div className="flex h-7 w-7 items-center justify-center bg-gray-100 text-gray-500">
              <User size={14} />
            </div>
            <span className="font-medium">Admin</span>
            <ChevronDown size={14} />
          </button>

          {open && (
            <div className="absolute right-0 top-10 w-44 border border-gray-200 bg-white shadow-md py-1 z-50">
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                <User size={14} />
                Profile
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
