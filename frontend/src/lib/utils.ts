import { clsx } from "clsx";

/* ── Utility: merge Tailwind classes safely ── */
export function cn(...inputs: (string | undefined | null | false)[]) {
  return clsx(inputs);
}

/* ── Date formatting helpers ── */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Status color mapping ── */
export function statusColor(status: string): string {
  const map: Record<string, string> = {
    CREATED: "bg-gray-100 text-gray-700",
    ASSIGNED: "bg-blue-50 text-blue-700",
    IN_TRANSIT: "bg-yellow-50 text-yellow-700",
    DELIVERED: "bg-green-50 text-green-700",
    FAILED: "bg-red-50 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

export function priorityColor(priority: string): string {
  return priority === "EXPRESS"
    ? "bg-red-50 text-red-700 border border-red-200"
    : "bg-gray-50 text-gray-600";
}
