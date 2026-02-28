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
import { formatDate, statusColor, priorityColor } from "@/lib/utils";
import {
  getParcels,
  createParcel,
  updateParcel,
  deleteParcel,
  importParcelsCsv,
  type ParcelFilters,
} from "@/services/parcels";
import type { Parcel, PaginatedResponse, ImportResult } from "@/types";
import { Plus, Upload, Eye, Pencil, Trash2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "CREATED", label: "Created" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Select Priority" },
  { value: "NORMAL", label: "Normal" },
  { value: "EXPRESS", label: "Express" },
];

const ZONE_FILTER_OPTIONS = [
  { value: "", label: "All Zones" },
  { value: "Zone A", label: "Zone A" },
  { value: "Zone B", label: "Zone B" },
  { value: "Zone C", label: "Zone C" },
  { value: "Zone D", label: "Zone D" },
  { value: "Zone E", label: "Zone E" },
];

type ModalMode = null | "view" | "create" | "edit" | "import";

interface FormData {
  barcode: string;
  tracking_no: string;
  recipient_name: string;
  recipient_phone: string;
  raw_address: string;
  zone: string;
  priority: string;
  status: string;
}

const emptyForm: FormData = {
  barcode: "",
  tracking_no: "",
  recipient_name: "",
  recipient_phone: "",
  raw_address: "",
  zone: "",
  priority: "NORMAL",
  status: "CREATED",
};

export default function ParcelsPage() {
  const [data, setData] = useState<PaginatedResponse<Parcel> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [saving, setSaving] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fetchParcels = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ParcelFilters = { page, q: search || undefined, status: statusFilter || undefined, zone: zoneFilter || undefined };
      const res = await getParcels(filters);
      setData(res);
    } catch {
      /* handle error */
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, zoneFilter]);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  // Debounced search
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, zoneFilter]);

  // Open modals
  function openCreate() {
    setForm(emptyForm);
    setErrors({});
    setModalMode("create");
  }

  function openEdit(parcel: Parcel) {
    setSelected(parcel);
    setForm({
      barcode: parcel.barcode,
      tracking_no: parcel.tracking_no ?? "",
      recipient_name: parcel.recipient_name ?? "",
      recipient_phone: parcel.recipient_phone ?? "",
      raw_address: parcel.raw_address ?? "",
      zone: parcel.zone ?? "",
      priority: parcel.priority,
      status: parcel.status,
    });
    setErrors({});
    setModalMode("edit");
  }

  function openView(parcel: Parcel) {
    setSelected(parcel);
    setModalMode("view");
  }

  function openImport() {
    setImportFile(null);
    setImportResult(null);
    setModalMode("import");
  }

  function closeModal() {
    setModalMode(null);
    setSelected(null);
  }

  // Submit create / edit
  async function handleSubmit() {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.barcode.trim()) errs.barcode = "Barcode is required.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      if (modalMode === "create") {
        await createParcel(form as unknown as Partial<Parcel>);
      } else if (modalMode === "edit" && selected) {
        await updateParcel(selected.id, form as unknown as Partial<Parcel>);
      }
      closeModal();
      fetchParcels();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      if (axiosErr.response?.data?.errors) {
        const fieldErrors: Partial<Record<keyof FormData, string>> = {};
        for (const [key, msgs] of Object.entries(axiosErr.response.data.errors)) {
          fieldErrors[key as keyof FormData] = msgs[0];
        }
        setErrors(fieldErrors);
      }
    } finally {
      setSaving(false);
    }
  }

  // Delete
  async function handleDelete(parcel: Parcel) {
    if (!window.confirm(`Delete parcel ${parcel.barcode}? This action cannot be undone.`)) return;
    try {
      await deleteParcel(parcel.id);
      fetchParcels();
    } catch {
      /* handle error */
    }
  }

  // Import CSV
  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    try {
      const result = await importParcelsCsv(importFile);
      setImportResult(result);
      fetchParcels();
    } catch {
      setImportResult({ ok: false, inserted: 0, skipped: 0, errors: ["Import failed. Check file format."] });
    } finally {
      setImporting(false);
    }
  }

  function updateForm(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // Table columns
  const columns: Column<Parcel>[] = [
    { key: "barcode", label: "Barcode", render: (r) => <span className="font-mono text-xs">{r.barcode}</span> },
    { key: "recipient_name", label: "Recipient", render: (r) => r.recipient_name ?? "-" },
    { key: "zone", label: "Zone", render: (r) => r.zone ?? "-" },
    {
      key: "priority",
      label: "Priority",
      render: (r) => <Badge className={priorityColor(r.priority)}>{r.priority}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge className={statusColor(r.status)}>{r.status.replace("_", " ")}</Badge>,
    },
    { key: "assigned_rider_id", label: "Rider", render: (r) => r.rider?.name ?? (r.assigned_rider_id ? `#${r.assigned_rider_id}` : "-") },
    { key: "created_at", label: "Created", render: (r) => formatDate(r.created_at) },
    {
      key: "_actions",
      label: "",
      className: "w-28",
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openView(r); }} className="p-1.5 text-gray-400 hover:text-gray-700"><Eye size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r); }} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Parcels Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">{data ? `${data.total} total records` : "Loading..."}</p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search barcode, tracking no, recipient..."
        filters={[
          { label: "Status", value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
          { label: "Zone", value: zoneFilter, onChange: setZoneFilter, options: ZONE_FILTER_OPTIONS },
        ]}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={openImport}><Upload size={14} className="mr-1.5" />Import CSV</Button>
            <Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1.5" />New Parcel</Button>
          </>
        }
      />

      {/* Table */}
      <DataTable<Parcel>
        columns={columns}
        data={data?.data ?? []}
        loading={loading}
        emptyMessage="No parcels found."
      />

      {data && (
        <Pagination
          currentPage={data.current_page}
          lastPage={data.last_page}
          onPageChange={setPage}
        />
      )}

      {/* ── View Modal ── */}
      <Modal open={modalMode === "view"} onClose={closeModal} title="Parcel Details" wide>
        {selected && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {([
              ["Barcode", selected.barcode],
              ["Tracking No", selected.tracking_no],
              ["Recipient", selected.recipient_name],
              ["Phone", selected.recipient_phone],
              ["Address", selected.raw_address],
              ["Zone", selected.zone],
              ["Priority", selected.priority],
              ["Status", selected.status],
              ["Assigned Rider", selected.rider?.name ?? (selected.assigned_rider_id ? `#${selected.assigned_rider_id}` : "-")],
              ["Assigned At", selected.assigned_at ? formatDate(selected.assigned_at) : "-"],
              ["Created", formatDate(selected.created_at)],
              ["Updated", formatDate(selected.updated_at)],
            ] as [string, string | null][]).map(([label, val]) => (
              <div key={label}>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</dt>
                <dd className="mt-0.5 text-gray-900">{val ?? "-"}</dd>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Create / Edit Modal ── */}
      <Modal
        open={modalMode === "create" || modalMode === "edit"}
        onClose={closeModal}
        title={modalMode === "create" ? "Create Parcel" : "Edit Parcel"}
        wide
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="Barcode" value={form.barcode} onChange={(e) => updateForm("barcode", e.target.value)} error={errors.barcode} disabled={modalMode === "edit"} />
          <Input label="Tracking No" value={form.tracking_no} onChange={(e) => updateForm("tracking_no", e.target.value)} error={errors.tracking_no} />
          <Input label="Recipient Name" value={form.recipient_name} onChange={(e) => updateForm("recipient_name", e.target.value)} error={errors.recipient_name} />
          <Input label="Recipient Phone" value={form.recipient_phone} onChange={(e) => updateForm("recipient_phone", e.target.value)} error={errors.recipient_phone} />
          <div className="col-span-2">
            <Input label="Raw Address" value={form.raw_address} onChange={(e) => updateForm("raw_address", e.target.value)} error={errors.raw_address} />
          </div>
          <Input label="Zone" value={form.zone} onChange={(e) => updateForm("zone", e.target.value)} error={errors.zone} />
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => updateForm("priority", e.target.value)}
            options={PRIORITY_OPTIONS.filter((o) => o.value !== "")}
            error={errors.priority}
          />
          {modalMode === "edit" && (
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => updateForm("status", e.target.value)}
              options={STATUS_OPTIONS.filter((o) => o.value !== "")}
              error={errors.status}
            />
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" size="sm" onClick={closeModal}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : modalMode === "create" ? "Create" : "Update"}
          </Button>
        </div>
      </Modal>

      {/* ── Import CSV Modal ── */}
      <Modal open={modalMode === "import"} onClose={closeModal} title="Import Parcels (CSV)">
        {importResult ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-green-50 border border-green-200 p-3">
                <span className="text-xs text-green-700 font-medium uppercase">Inserted</span>
                <p className="text-xl font-semibold text-green-800">{importResult.inserted}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-3">
                <span className="text-xs text-gray-500 font-medium uppercase">Skipped</span>
                <p className="text-xl font-semibold text-gray-700">{importResult.skipped}</p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="text-xs text-red-600">
                {importResult.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button size="sm" onClick={closeModal}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a CSV file with columns: barcode, tracking_no, recipient_name, recipient_phone, raw_address, zone, priority
            </p>
            <div className="border-2 border-dashed border-gray-300 p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                className="mx-auto text-sm text-gray-600"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <Button variant="ghost" size="sm" onClick={closeModal}>Cancel</Button>
              <Button size="sm" onClick={handleImport} disabled={!importFile || importing}>
                {importing ? "Importing..." : "Upload & Import"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
