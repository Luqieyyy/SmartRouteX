"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Bike,
  ArrowRightLeft,
  MapPin,
  BarChart3,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parcels", label: "Parcels", icon: Package },
  { href: "/riders", label: "Riders", icon: Bike },
  { href: "/assignments", label: "Assignments", icon: ArrowRightLeft },
  { href: "/tracking", label: "Live Tracking", icon: MapPin },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 z-40 flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-5">
        <div className="h-7 w-7 bg-[#E10600] flex items-center justify-center">
          <span className="text-white text-xs font-bold">SR</span>
        </div>
        <span className="text-sm font-bold tracking-tight text-gray-900">
          SmartRouteX
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-red-50 text-[#E10600]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-5 py-3">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
          Admin Control Panel
        </p>
      </div>
    </aside>
  );
}
