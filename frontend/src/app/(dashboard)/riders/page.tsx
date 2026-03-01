"use client";

import React, { useCallback, useEffect, useState } from "react";
import DataTable, { Column } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import FilterBar from "@/components/ui/FilterBar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  getRiders,
  createRider,
  updateRider,
  deleteRider,
  resendSetupEmail,
} from "@/services/riders";
import { getActiveZones } from "@/services/zones";
import type { Rider, RiderStatus, PaginatedResponse, Zone } from "@/types";
import { useHubContext } from "@/lib/hub-context";
import { Plus, Pencil, Trash2, Mail, RefreshCw } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */

type ModalMode = null | "create" | "edit";

interface RiderForm {
  name: string;
  work_email: string;
  phone: string;
  zone: string;
  zone_id: string;
  employment_type: string;
  warehouse: string;
  vehicle_type: string;
  vehicle_plate: string;
  max_parcel_capacity: string;
  shift_start: string;
  shift_end: string;
  status: RiderStatus;
}

const emptyForm: RiderForm = {
  name: "",
  work_email: "",
  phone: "",
  zone: "",
  zone_id: "",
  employment_type: "",
  warehouse: "",
  vehicle_type: "",
  vehicle_plate: "",
  max_parcel_capacity: "",
  shift_start: "",
  shift_end: "",
  status: "PENDING",
};

/* ── Status styling ────────────────────────────────────────── */

const statusBadge: Record<RiderStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  ACTIVE: "bg-green-50 text-green-700",
  SUSPENDED: "bg-red-50 text-red-700",
  DEACTIVATED: "bg-gray-100 text-gray-500",
};

const statusOptions: { value: RiderStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

/* ── Component ─────────────────────────────────────────────── */

export default function RidersPage() {
  const { refreshKey } = useHubContext();
  const [data, setData] = useState<PaginatedResponse<Rider> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Rider | null>(null);
  const [form, setForm] = useState<RiderForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof RiderForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /* ── Zone options (from hub context) ─────────────────────── */
  const [zoneOptions, setZoneOptions] = useState<Zone[]>([]);

  useEffect(() => {
    getActiveZones()
      .then(setZoneOptions)
      .catch(() => {});
  }, [refreshKey]);

  /* ── Data fetching ───────────────────────────────────────── */

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRiders({
        page,
        q: search || undefined,
        zone: zoneFilter || undefined,
        status: (statusFilter as RiderStatus) || undefined,
      });
      setData(res);
    } catch {
      /* handle error */
    } finally {
      setLoading(false);
    }
  }, [page, search, zoneFilter, statusFilter, refreshKey]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  useEffect(() => {
    setPage(1);
  }, [search, zoneFilter, statusFilter]);

  /* ── Toast auto-dismiss ──────────────────────────────────── */

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Modal helpers ───────────────────────────────────────── */

  function openCreate() {
    setForm(emptyForm);
    setErrors({});
    setModalMode("create");
  }

  function openEdit(rider: Rider) {
    setSelected(rider);
    setForm({
      name: rider.name,
      work_email: rider.work_email ?? "",
      phone: rider.phone ?? "",
      zone: rider.zone ?? "",
      zone_id: rider.zone_id != null ? String(rider.zone_id) : "",
      employment_type: rider.employment_type ?? "",
      warehouse: rider.warehouse ?? "",
      vehicle_type: rider.vehicle_type ?? "",
      vehicle_plate: rider.vehicle_plate ?? "",
      max_parcel_capacity: rider.max_parcel_capacity != null ? String(rider.max_parcel_capacity) : "",
      shift_start: rider.shift_start ?? "",
      shift_end: rider.shift_end ?? "",
      status: rider.status,
    });
    setErrors({});
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelected(null);
  }

  /* ── Submit create/edit ──────────────────────────────────── */

  async function handleSubmit() {
    const errs: Partial<Record<keyof RiderForm, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.work_email.trim()) errs.work_email = "Work email is required.";
    if (form.work_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.work_email))
      errs.work_email = "Enter a valid email address.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "create") {
        const res = await createRider({
          name: form.name,
          work_email: form.work_email,
          phone: form.phone || null,
          zone: form.zone || null,
          zone_id: form.zone_id ? Number(form.zone_id) : null,
          employment_type: form.employment_type || null,
          warehouse: form.warehouse || null,
          vehicle_type: form.vehicle_type || null,
          vehicle_plate: form.vehicle_plate || null,
          max_parcel_capacity: form.max_parcel_capacity ? Number(form.max_parcel_capacity) : null,
          shift_start: form.shift_start || null,
          shift_end: form.shift_end || null,
        });
        setToast(res.message || "Rider created. Activation email sent.");
      } else if (selected) {
        await updateRider(selected.id, {
          name: form.name,
          work_email: form.work_email,
          phone: form.phone || null,
          zone: form.zone || null,
          zone_id: form.zone_id ? Number(form.zone_id) : null,
          employment_type: form.employment_type || null,
          warehouse: form.warehouse || null,
          vehicle_type: form.vehicle_type || null,
          vehicle_plate: form.vehicle_plate || null,
          max_parcel_capacity: form.max_parcel_capacity ? Number(form.max_parcel_capacity) : null,
          shift_start: form.shift_start || null,
          shift_end: form.shift_end || null,
          status: form.status,
        });
        setToast("Rider updated successfully.");
      }
      closeModal();
      fetchRiders();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { errors?: Record<string, string[]>; message?: string } };
      };
      if (axiosErr.response?.data?.errors) {
        const fe: Partial<Record<keyof RiderForm, string>> = {};
        for (const [k, v] of Object.entries(axiosErr.response.data.errors))
          fe[k as keyof RiderForm] = v[0];
        setErrors(fe);
      } else if (axiosErr.response?.data?.message) {
        setToast(axiosErr.response.data.message);
      }
    } finally {
      setSaving(false);
    }
  }

  /* ── Resend activation email ─────────────────────────────── */

  async function handleResendEmail(rider: Rider) {
    setResending(rider.id);
    try {
      const res = await resendSetupEmail(rider.id);
      setToast(res.message || "Setup email resent.");
    } catch {
      setToast("Failed to resend email.");
    } finally {
      setResending(null);
    }
  }

  /* ── Delete ──────────────────────────────────────────────── */

  async function handleDelete(rider: Rider) {
    if (!window.confirm(`Remove rider ${rider.name}?`)) return;
    try {
      await deleteRider(rider.id);
      fetchRiders();
    } catch {
      /* */
    }
  }

  /* ── Form field updater ──────────────────────────────────── */

  function updateField(key: keyof RiderForm, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  /* ── Format date helper ──────────────────────────────────── */

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /* ── Table columns ───────────────────────────────────────── */

  const columns: Column<Rider>[] = [
    {
      key: "name",
      label: "Name",
      render: (r) => (
        <div>
          <span className="font-medium text-gray-900">{r.name}</span>
          {r.work_email && (
            <p className="text-xs text-gray-500 mt-0.5">{r.work_email}</p>
          )}
        </div>
      ),
    },
    { key: "phone", label: "Phone", render: (r) => r.phone ?? "-" },
    { key: "zone", label: "Zone", render: (r) => r.assigned_zone?.name ?? r.zone ?? "-" },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge className={statusBadge[r.status] ?? "bg-gray-100 text-gray-500"}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "last_login_at",
      label: "Last Login",
      render: (r) => (
        <span className="text-xs text-gray-500">{formatDate(r.last_login_at)}</span>
      ),
    },
    {
      key: "parcels_count",
      label: "Parcels",
      render: (r) => r.parcels_count ?? 0,
    },
    {
      key: "_actions",
      label: "",
      className: "w-28",
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResendEmail(r);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600"
            title="Resend activation email"
            disabled={resending === r.id}
          >
            {resending === r.id ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Mail size={14} />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(r);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600"
            title="Edit rider"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(r);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600"
            title="Delete rider"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-gray-900 text-white text-sm px-4 py-3 shadow-lg max-w-sm animate-in fade-in">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Riders</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {data ? `${data.total} riders registered` : "Loading..."}
          </p>
        </div>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rider name, email, phone..."
        filters={[
          {
            label: "Zone",
            value: zoneFilter,
            onChange: setZoneFilter,
            options: [
              { value: "", label: "All Zones" },
              ...zoneOptions.map((z) => ({
                value: z.name,
                label: z.name,
              })),
            ],
          },
          {
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "", label: "All Statuses" },
              { value: "PENDING", label: "Pending" },
              { value: "ACTIVE", label: "Active" },
              { value: "SUSPENDED", label: "Suspended" },
              { value: "DEACTIVATED", label: "Deactivated" },
            ],
          },
        ]}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1.5" />
            Add Rider
          </Button>
        }
      />

      <DataTable<Rider>
        columns={columns}
        data={data?.data ?? []}
        loading={loading}
        emptyMessage="No riders found."
      />
      {data && (
        <Pagination
          currentPage={data.current_page}
          lastPage={data.last_page}
          onPageChange={setPage}
        />
      )}

      {/* ── Create / Edit Modal ────────────────────────────────── */}
      <Modal
        open={modalMode !== null}
        onClose={closeModal}
        title={modalMode === "create" ? "Add Rider" : "Edit Rider"}
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* ── Basic info ── */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Basic Info
          </p>
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={errors.name}
          />
          <Input
            label="Work Email"
            type="email"
            value={form.work_email}
            onChange={(e) => updateField("work_email", e.target.value)}
            error={errors.work_email}
            placeholder="rider@company.com"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              error={errors.phone}
            />
            <Input
              label="Zone (legacy)"
              value={form.zone}
              onChange={(e) => updateField("zone", e.target.value)}
              error={errors.zone}
            />
          </div>
          {zoneOptions.length > 0 && (
            <Select
              label="Assigned Zone"
              value={form.zone_id}
              onChange={(e) => updateField("zone_id", e.target.value)}
              options={[
                { value: "", label: "No zone assigned" },
                ...zoneOptions.map((z) => ({
                  value: String(z.id),
                  label: `${z.code} — ${z.name}`,
                })),
              ]}
            />
          )}

          {/* ── Employment ── */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">
            Employment
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Employment Type"
              value={form.employment_type}
              onChange={(e) => updateField("employment_type", e.target.value)}
              options={[
                { value: "", label: "Select type" },
                { value: "FULL_TIME", label: "Full-time" },
                { value: "PART_TIME", label: "Part-time" },
                { value: "CONTRACTOR", label: "Contractor" },
                { value: "FREELANCER", label: "Freelancer" },
              ]}
            />
            <Select
              label="Assigned Warehouse"
              value={form.warehouse}
              onChange={(e) => updateField("warehouse", e.target.value)}
              options={[
                { value: "", label: "Select warehouse" },
                { value: "Warehouse A - KL", label: "Warehouse A – KL" },
                { value: "Warehouse B - PJ", label: "Warehouse B – PJ" },
                { value: "Warehouse C - Melaka", label: "Warehouse C – Melaka" },
                { value: "Warehouse D - JB", label: "Warehouse D – JB" },
                { value: "Warehouse E - Penang", label: "Warehouse E – Penang" },
              ]}
            />
          </div>

          {/* ── Vehicle ── */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">
            Vehicle
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Vehicle Type"
              value={form.vehicle_type}
              onChange={(e) => updateField("vehicle_type", e.target.value)}
              options={[
                { value: "", label: "Select vehicle" },
                { value: "MOTORCYCLE", label: "Motorcycle" },
                { value: "CAR", label: "Car" },
                { value: "VAN", label: "Van" },
                { value: "BICYCLE", label: "Bicycle" },
                { value: "TRUCK", label: "Truck" },
              ]}
            />
            <Input
              label="Vehicle Plate"
              value={form.vehicle_plate}
              onChange={(e) => updateField("vehicle_plate", e.target.value)}
              placeholder="e.g. WXX 1234"
            />
          </div>
          <Input
            label="Max Parcel Capacity"
            type="number"
            value={form.max_parcel_capacity}
            onChange={(e) => updateField("max_parcel_capacity", e.target.value)}
            placeholder="e.g. 50"
          />

          {/* ── Shift ── */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">
            Shift
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Shift Start"
              type="time"
              value={form.shift_start}
              onChange={(e) => updateField("shift_start", e.target.value)}
            />
            <Input
              label="Shift End"
              type="time"
              value={form.shift_end}
              onChange={(e) => updateField("shift_end", e.target.value)}
            />
          </div>

          {/* ── Status (edit only) ── */}
          {modalMode === "edit" && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">
                Account
              </p>
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                options={statusOptions}
              />
            </>
          )}
        </div>

        {/* Resend button inside edit modal */}
        {modalMode === "edit" && selected && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => handleResendEmail(selected)}
              disabled={resending === selected.id}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {resending === selected.id ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Mail size={12} />
              )}
              Resend Activation Email
            </button>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" size="sm" onClick={closeModal}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving
              ? "Saving..."
              : modalMode === "create"
              ? "Create & Send Invite"
              : "Update"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
