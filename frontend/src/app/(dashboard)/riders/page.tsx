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
import { getRiders, createRider, updateRider, deleteRider } from "@/services/riders";
import type { Rider, PaginatedResponse } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

type ModalMode = null | "create" | "edit";

interface RiderForm {
  name: string;
  phone: string;
  zone: string;
  is_active: string;
}

const emptyForm: RiderForm = { name: "", phone: "", zone: "", is_active: "1" };

export default function RidersPage() {
  const [data, setData] = useState<PaginatedResponse<Rider> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Rider | null>(null);
  const [form, setForm] = useState<RiderForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof RiderForm, string>>>({});
  const [saving, setSaving] = useState(false);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRiders({ page, q: search || undefined, zone: zoneFilter || undefined });
      setData(res);
    } catch {
      /* handle error */
    } finally {
      setLoading(false);
    }
  }, [page, search, zoneFilter]);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);
  useEffect(() => { setPage(1); }, [search, zoneFilter]);

  function openCreate() {
    setForm(emptyForm);
    setErrors({});
    setModalMode("create");
  }
  function openEdit(rider: Rider) {
    setSelected(rider);
    setForm({
      name: rider.name,
      phone: rider.phone ?? "",
      zone: rider.zone ?? "",
      is_active: rider.is_active ? "1" : "0",
    });
    setErrors({});
    setModalMode("edit");
  }
  function closeModal() { setModalMode(null); setSelected(null); }

  async function handleSubmit() {
    const errs: Partial<Record<keyof RiderForm, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    const payload = { name: form.name, phone: form.phone || null, zone: form.zone || null, is_active: form.is_active === "1" };
    try {
      if (modalMode === "create") await createRider(payload);
      else if (selected) await updateRider(selected.id, payload);
      closeModal();
      fetchRiders();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      if (axiosErr.response?.data?.errors) {
        const fe: Partial<Record<keyof RiderForm, string>> = {};
        for (const [k, v] of Object.entries(axiosErr.response.data.errors)) fe[k as keyof RiderForm] = v[0];
        setErrors(fe);
      }
    } finally { setSaving(false); }
  }

  async function handleDelete(rider: Rider) {
    if (!window.confirm(`Remove rider ${rider.name}?`)) return;
    try { await deleteRider(rider.id); fetchRiders(); } catch { /* */ }
  }

  function updateField(key: keyof RiderForm, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }

  const columns: Column<Rider>[] = [
    { key: "name", label: "Name", render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: "phone", label: "Phone", render: (r) => r.phone ?? "-" },
    { key: "zone", label: "Zone", render: (r) => r.zone ?? "-" },
    {
      key: "is_active", label: "Status",
      render: (r) => <Badge className={r.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}>{r.is_active ? "Active" : "Inactive"}</Badge>,
    },
    { key: "parcels_count", label: "Assigned Parcels", render: (r) => r.parcels_count ?? 0 },
    {
      key: "latest_location", label: "Location",
      render: (r) => r.latest_location ? <span className="text-xs text-gray-500">{r.latest_location.lat.toFixed(4)}, {r.latest_location.lng.toFixed(4)}</span> : <span className="text-xs text-gray-400">No signal</span>,
    },
    {
      key: "_actions", label: "", className: "w-20",
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r); }} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Riders</h1>
          <p className="text-xs text-gray-500 mt-0.5">{data ? `${data.total} riders registered` : "Loading..."}</p>
        </div>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rider name, phone..."
        filters={[
          { label: "Zone", value: zoneFilter, onChange: setZoneFilter, options: [{ value: "", label: "All Zones" }, { value: "Zone A", label: "Zone A" }, { value: "Zone B", label: "Zone B" }, { value: "Zone C", label: "Zone C" }] },
        ]}
        actions={<Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1.5" />Add Rider</Button>}
      />

      <DataTable<Rider> columns={columns} data={data?.data ?? []} loading={loading} emptyMessage="No riders found." />
      {data && <Pagination currentPage={data.current_page} lastPage={data.last_page} onPageChange={setPage} />}

      <Modal open={modalMode !== null} onClose={closeModal} title={modalMode === "create" ? "Add Rider" : "Edit Rider"}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} error={errors.name} />
          <Input label="Phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} error={errors.phone} />
          <Input label="Zone" value={form.zone} onChange={(e) => updateField("zone", e.target.value)} error={errors.zone} />
          <Select
            label="Status"
            value={form.is_active}
            onChange={(e) => updateField("is_active", e.target.value)}
            options={[{ value: "1", label: "Active" }, { value: "0", label: "Inactive" }]}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" size="sm" onClick={closeModal}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : modalMode === "create" ? "Create" : "Update"}</Button>
        </div>
      </Modal>
    </div>
  );
}
