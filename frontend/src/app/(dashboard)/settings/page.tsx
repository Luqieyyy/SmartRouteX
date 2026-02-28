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
  getHubs,
  getActiveHubs,
  createHub,
  updateHub,
  deleteHub,
  switchHub,
} from "@/services/hubs";
import {
  getZones,
  createZone,
  updateZone,
  deleteZone,
} from "@/services/zones";
import type { Hub, Zone, AdminRole, PaginatedResponse } from "@/types";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  MapPinned,
  ArrowRightLeft,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */

type Tab = "hubs" | "zones";
type HubModal = null | "create" | "edit";
type ZoneModal = null | "create" | "edit";

interface HubForm {
  name: string;
  code: string;
  state: string;
  latitude: string;
  longitude: string;
  is_active: string;
}

interface ZoneForm {
  hub_id: string;
  name: string;
  code: string;
  is_active: string;
}

const emptyHubForm: HubForm = {
  name: "",
  code: "",
  state: "",
  latitude: "",
  longitude: "",
  is_active: "1",
};

const emptyZoneForm: ZoneForm = {
  hub_id: "",
  name: "",
  code: "",
  is_active: "1",
};

/* ── Component ─────────────────────────────────────────────── */

export default function SettingsPage() {
  /* ── Auth / role ─────────────────────────────────────────── */
  const [role, setRole] = useState<AdminRole>("admin");
  const [activeHubId, setActiveHubId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user?.role) setRole(user.role as AdminRole);
        if (user?.hub_id) setActiveHubId(user.hub_id);
      }
      const hubId = localStorage.getItem("activeHubId");
      if (hubId) setActiveHubId(Number(hubId));
    } catch {
      /* ignore */
    }
  }, []);

  const isSuperAdmin = role === "SUPER_ADMIN";

  /* ── Tab ─────────────────────────────────────────────────── */
  const [tab, setTab] = useState<Tab>("hubs");

  /* ── Toast ───────────────────────────────────────────────── */
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ══════════════════════════════════════════════════════════
     Hub Management
     ══════════════════════════════════════════════════════════ */

  const [hubData, setHubData] = useState<PaginatedResponse<Hub> | null>(null);
  const [hubLoading, setHubLoading] = useState(true);
  const [hubSearch, setHubSearch] = useState("");
  const [hubPage, setHubPage] = useState(1);
  const [hubModal, setHubModal] = useState<HubModal>(null);
  const [hubSelected, setHubSelected] = useState<Hub | null>(null);
  const [hubForm, setHubForm] = useState<HubForm>(emptyHubForm);
  const [hubErrors, setHubErrors] = useState<Partial<Record<keyof HubForm, string>>>({});
  const [hubSaving, setHubSaving] = useState(false);

  /* Hub switcher (Super Admin) */
  const [allHubs, setAllHubs] = useState<Hub[]>([]);

  const fetchHubs = useCallback(async () => {
    if (!isSuperAdmin) return;
    setHubLoading(true);
    try {
      const res = await getHubs({ q: hubSearch || undefined, page: hubPage });
      setHubData(res);
    } catch {
      /* */
    } finally {
      setHubLoading(false);
    }
  }, [hubSearch, hubPage, isSuperAdmin]);

  const fetchActiveHubs = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const hubs = await getActiveHubs();
      setAllHubs(hubs);
    } catch {
      /* */
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchHubs();
  }, [fetchHubs]);

  useEffect(() => {
    fetchActiveHubs();
  }, [fetchActiveHubs]);

  useEffect(() => {
    setHubPage(1);
  }, [hubSearch]);

  /* Hub modal helpers */
  function openHubCreate() {
    setHubForm(emptyHubForm);
    setHubErrors({});
    setHubModal("create");
  }

  function openHubEdit(hub: Hub) {
    setHubSelected(hub);
    setHubForm({
      name: hub.name,
      code: hub.code,
      state: hub.state ?? "",
      latitude: hub.latitude != null ? String(hub.latitude) : "",
      longitude: hub.longitude != null ? String(hub.longitude) : "",
      is_active: hub.is_active ? "1" : "0",
    });
    setHubErrors({});
    setHubModal("edit");
  }

  function closeHubModal() {
    setHubModal(null);
    setHubSelected(null);
  }

  async function handleHubSubmit() {
    const errs: Partial<Record<keyof HubForm, string>> = {};
    if (!hubForm.name.trim()) errs.name = "Name is required.";
    if (!hubForm.code.trim()) errs.code = "Code is required.";
    if (Object.keys(errs).length) {
      setHubErrors(errs);
      return;
    }

    setHubSaving(true);
    try {
      const payload = {
        name: hubForm.name.trim(),
        code: hubForm.code.trim().toUpperCase(),
        state: hubForm.state.trim() || null,
        latitude: hubForm.latitude ? Number(hubForm.latitude) : null,
        longitude: hubForm.longitude ? Number(hubForm.longitude) : null,
        is_active: hubForm.is_active === "1",
      };

      if (hubModal === "create") {
        const res = await createHub(payload);
        setToast(res.message || "Hub created.");
      } else if (hubSelected) {
        await updateHub(hubSelected.id, payload);
        setToast("Hub updated.");
      }
      closeHubModal();
      fetchHubs();
      fetchActiveHubs();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { errors?: Record<string, string[]>; message?: string } };
      };
      if (axiosErr.response?.data?.errors) {
        const fe: Partial<Record<keyof HubForm, string>> = {};
        for (const [k, v] of Object.entries(axiosErr.response.data.errors))
          fe[k as keyof HubForm] = v[0];
        setHubErrors(fe);
      } else if (axiosErr.response?.data?.message) {
        setToast(axiosErr.response.data.message);
      }
    } finally {
      setHubSaving(false);
    }
  }

  async function handleHubDelete(hub: Hub) {
    if (!window.confirm(`Delete hub "${hub.name}"? This action is permanent.`)) return;
    try {
      const res = await deleteHub(hub.id);
      setToast(res.message || "Hub deleted.");
      fetchHubs();
      fetchActiveHubs();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      setToast(axiosErr.response?.data?.message || "Cannot delete hub.");
    }
  }

  async function handleSwitchHub(hubId: number) {
    try {
      const res = await switchHub(hubId);
      setActiveHubId(hubId);
      setToast(res.message || "Switched to hub.");
      // Refresh zone data if on zones tab
      if (tab === "zones") fetchZones();
    } catch {
      setToast("Failed to switch hub.");
    }
  }

  function updateHubField(key: keyof HubForm, value: string) {
    setHubForm((p) => ({ ...p, [key]: value }));
    setHubErrors((p) => ({ ...p, [key]: undefined }));
  }

  const hubColumns: Column<Hub>[] = [
    {
      key: "code",
      label: "Code",
      render: (h) => (
        <span className="font-mono text-xs font-semibold text-gray-900">{h.code}</span>
      ),
    },
    {
      key: "name",
      label: "Hub Name",
      render: (h) => (
        <div>
          <span className="font-medium text-gray-900">{h.name}</span>
          {h.state && <p className="text-xs text-gray-500 mt-0.5">{h.state}</p>}
        </div>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (h) => (
        <Badge className={h.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}>
          {h.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "riders_count",
      label: "Riders",
      render: (h) => h.riders_count ?? 0,
    },
    {
      key: "zones_count",
      label: "Zones",
      render: (h) => h.zones_count ?? 0,
    },
    {
      key: "_actions",
      label: "",
      className: "w-24",
      render: (h) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openHubEdit(h);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600"
            title="Edit hub"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleHubDelete(h);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600"
            title="Delete hub"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  /* ══════════════════════════════════════════════════════════
     Zone Management
     ══════════════════════════════════════════════════════════ */

  const [zoneData, setZoneData] = useState<PaginatedResponse<Zone> | null>(null);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [zoneSearch, setZoneSearch] = useState("");
  const [zonePage, setZonePage] = useState(1);
  const [zoneModal, setZoneModal] = useState<ZoneModal>(null);
  const [zoneSelected, setZoneSelected] = useState<Zone | null>(null);
  const [zoneForm, setZoneForm] = useState<ZoneForm>(emptyZoneForm);
  const [zoneErrors, setZoneErrors] = useState<Partial<Record<keyof ZoneForm, string>>>({});
  const [zoneSaving, setZoneSaving] = useState(false);

  const fetchZones = useCallback(async () => {
    setZoneLoading(true);
    try {
      const res = await getZones({
        q: zoneSearch || undefined,
        page: zonePage,
      });
      setZoneData(res);
    } catch {
      /* */
    } finally {
      setZoneLoading(false);
    }
  }, [zoneSearch, zonePage]);

  useEffect(() => {
    if (tab === "zones") fetchZones();
  }, [tab, fetchZones]);

  useEffect(() => {
    setZonePage(1);
  }, [zoneSearch]);

  /* Zone modal helpers */
  function openZoneCreate() {
    setZoneForm({ ...emptyZoneForm, hub_id: activeHubId ? String(activeHubId) : "" });
    setZoneErrors({});
    setZoneModal("create");
  }

  function openZoneEdit(zone: Zone) {
    setZoneSelected(zone);
    setZoneForm({
      hub_id: String(zone.hub_id),
      name: zone.name,
      code: zone.code,
      is_active: zone.is_active ? "1" : "0",
    });
    setZoneErrors({});
    setZoneModal("edit");
  }

  function closeZoneModal() {
    setZoneModal(null);
    setZoneSelected(null);
  }

  async function handleZoneSubmit() {
    const errs: Partial<Record<keyof ZoneForm, string>> = {};
    if (!zoneForm.name.trim()) errs.name = "Name is required.";
    if (!zoneForm.code.trim()) errs.code = "Code is required.";
    if (isSuperAdmin && !zoneForm.hub_id) errs.hub_id = "Hub is required.";
    if (Object.keys(errs).length) {
      setZoneErrors(errs);
      return;
    }

    setZoneSaving(true);
    try {
      if (zoneModal === "create") {
        const payload: Record<string, unknown> = {
          name: zoneForm.name.trim(),
          code: zoneForm.code.trim().toUpperCase(),
          is_active: zoneForm.is_active === "1",
        };
        if (isSuperAdmin && zoneForm.hub_id) payload.hub_id = Number(zoneForm.hub_id);
        const res = await createZone(payload as Parameters<typeof createZone>[0]);
        setToast(res.message || "Zone created.");
      } else if (zoneSelected) {
        await updateZone(zoneSelected.id, {
          name: zoneForm.name.trim(),
          code: zoneForm.code.trim().toUpperCase(),
          is_active: zoneForm.is_active === "1",
        });
        setToast("Zone updated.");
      }
      closeZoneModal();
      fetchZones();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { errors?: Record<string, string[]>; message?: string } };
      };
      if (axiosErr.response?.data?.errors) {
        const fe: Partial<Record<keyof ZoneForm, string>> = {};
        for (const [k, v] of Object.entries(axiosErr.response.data.errors))
          fe[k as keyof ZoneForm] = v[0];
        setZoneErrors(fe);
      } else if (axiosErr.response?.data?.message) {
        setToast(axiosErr.response.data.message);
      }
    } finally {
      setZoneSaving(false);
    }
  }

  async function handleZoneDelete(zone: Zone) {
    if (!window.confirm(`Delete zone "${zone.name}"?`)) return;
    try {
      const res = await deleteZone(zone.id);
      setToast(res.message || "Zone deleted.");
      fetchZones();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      setToast(axiosErr.response?.data?.message || "Cannot delete zone.");
    }
  }

  function updateZoneField(key: keyof ZoneForm, value: string) {
    setZoneForm((p) => ({ ...p, [key]: value }));
    setZoneErrors((p) => ({ ...p, [key]: undefined }));
  }

  const zoneColumns: Column<Zone>[] = [
    {
      key: "code",
      label: "Code",
      render: (z) => (
        <span className="font-mono text-xs font-semibold text-gray-900">{z.code}</span>
      ),
    },
    {
      key: "name",
      label: "Zone Name",
      render: (z) => <span className="font-medium text-gray-900">{z.name}</span>,
    },
    ...(isSuperAdmin
      ? [
          {
            key: "hub",
            label: "Hub",
            render: (z: Zone) => (
              <span className="text-xs text-gray-600">
                {z.hub ? `${z.hub.code} — ${z.hub.name}` : "-"}
              </span>
            ),
          } as Column<Zone>,
        ]
      : []),
    {
      key: "is_active",
      label: "Status",
      render: (z) => (
        <Badge className={z.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}>
          {z.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "riders_count",
      label: "Riders",
      render: (z) => z.riders_count ?? 0,
    },
    {
      key: "_actions",
      label: "",
      className: "w-24",
      render: (z) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openZoneEdit(z);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600"
            title="Edit zone"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoneDelete(z);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600"
            title="Delete zone"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  /* ══════════════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-gray-900 text-white text-sm px-4 py-3 shadow-lg max-w-sm animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage hubs, zones, and system configuration
          </p>
        </div>

        {/* Hub Switcher (Super Admin only) */}
        {isSuperAdmin && allHubs.length > 0 && (
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={14} className="text-gray-400" />
            <select
              value={activeHubId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleSwitchHub(Number(val));
                else {
                  localStorage.removeItem("activeHubId");
                  setActiveHubId(null);
                }
              }}
              className="border border-gray-300 px-3 py-1.5 text-sm text-gray-700 bg-white focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
            >
              <option value="">All Hubs (Global)</option>
              {allHubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.code} — {h.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab("hubs")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "hubs"
              ? "border-[#E10600] text-[#E10600]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Building2 size={14} />
          Hubs
        </button>
        <button
          onClick={() => setTab("zones")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "zones"
              ? "border-[#E10600] text-[#E10600]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <MapPinned size={14} />
          Zones
        </button>
      </div>

      {/* ── Hub Tab ────────────────────────────────────────────── */}
      {tab === "hubs" && (
        <>
          {!isSuperAdmin ? (
            <div className="border border-gray-200 bg-gray-50 px-6 py-10 text-center">
              <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                Hub management is restricted to Super Admins.
              </p>
            </div>
          ) : (
            <>
              <FilterBar
                searchValue={hubSearch}
                onSearchChange={setHubSearch}
                searchPlaceholder="Search hub name or code..."
                actions={
                  <Button size="sm" onClick={openHubCreate}>
                    <Plus size={14} className="mr-1.5" />
                    Add Hub
                  </Button>
                }
              />

              <DataTable<Hub>
                columns={hubColumns}
                data={hubData?.data ?? []}
                loading={hubLoading}
                emptyMessage="No hubs found."
              />
              {hubData && (
                <Pagination
                  currentPage={hubData.current_page}
                  lastPage={hubData.last_page}
                  onPageChange={setHubPage}
                />
              )}
            </>
          )}
        </>
      )}

      {/* ── Zone Tab ───────────────────────────────────────────── */}
      {tab === "zones" && (
        <>
          <FilterBar
            searchValue={zoneSearch}
            onSearchChange={setZoneSearch}
            searchPlaceholder="Search zone name or code..."
            actions={
              <Button size="sm" onClick={openZoneCreate}>
                <Plus size={14} className="mr-1.5" />
                Add Zone
              </Button>
            }
          />

          <DataTable<Zone>
            columns={zoneColumns}
            data={zoneData?.data ?? []}
            loading={zoneLoading}
            emptyMessage="No zones found."
          />
          {zoneData && (
            <Pagination
              currentPage={zoneData.current_page}
              lastPage={zoneData.last_page}
              onPageChange={setZonePage}
            />
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
         Hub Modal
         ══════════════════════════════════════════════════════════ */}
      <Modal
        open={hubModal !== null}
        onClose={closeHubModal}
        title={hubModal === "create" ? "Create Hub" : "Edit Hub"}
      >
        <div className="space-y-4">
          <Input
            label="Hub Name"
            value={hubForm.name}
            onChange={(e) => updateHubField("name", e.target.value)}
            error={hubErrors.name}
            placeholder="e.g. Kuala Lumpur Hub"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Code"
              value={hubForm.code}
              onChange={(e) => updateHubField("code", e.target.value.toUpperCase())}
              error={hubErrors.code}
              placeholder="e.g. KUL"
              maxLength={10}
            />
            <Input
              label="State"
              value={hubForm.state}
              onChange={(e) => updateHubField("state", e.target.value)}
              error={hubErrors.state}
              placeholder="e.g. Selangor"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={hubForm.latitude}
              onChange={(e) => updateHubField("latitude", e.target.value)}
              error={hubErrors.latitude}
              placeholder="e.g. 3.1390"
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={hubForm.longitude}
              onChange={(e) => updateHubField("longitude", e.target.value)}
              error={hubErrors.longitude}
              placeholder="e.g. 101.6869"
            />
          </div>
          <Select
            label="Status"
            value={hubForm.is_active}
            onChange={(e) => updateHubField("is_active", e.target.value)}
            options={[
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
            ]}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" size="sm" onClick={closeHubModal}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleHubSubmit} disabled={hubSaving}>
            {hubSaving ? "Saving..." : hubModal === "create" ? "Create Hub" : "Update"}
          </Button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
         Zone Modal
         ══════════════════════════════════════════════════════════ */}
      <Modal
        open={zoneModal !== null}
        onClose={closeZoneModal}
        title={zoneModal === "create" ? "Create Zone" : "Edit Zone"}
      >
        <div className="space-y-4">
          {/* Hub selection (Super Admin only, create only) */}
          {isSuperAdmin && zoneModal === "create" && (
            <Select
              label="Hub"
              value={zoneForm.hub_id}
              onChange={(e) => updateZoneField("hub_id", e.target.value)}
              error={zoneErrors.hub_id}
              options={[
                { value: "", label: "Select hub..." },
                ...allHubs.map((h) => ({
                  value: String(h.id),
                  label: `${h.code} — ${h.name}`,
                })),
              ]}
            />
          )}
          <Input
            label="Zone Name"
            value={zoneForm.name}
            onChange={(e) => updateZoneField("name", e.target.value)}
            error={zoneErrors.name}
            placeholder="e.g. Downtown KL"
          />
          <Input
            label="Code"
            value={zoneForm.code}
            onChange={(e) => updateZoneField("code", e.target.value.toUpperCase())}
            error={zoneErrors.code}
            placeholder="e.g. KL-DT"
            maxLength={20}
          />
          <Select
            label="Status"
            value={zoneForm.is_active}
            onChange={(e) => updateZoneField("is_active", e.target.value)}
            options={[
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
            ]}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" size="sm" onClick={closeZoneModal}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleZoneSubmit} disabled={zoneSaving}>
            {zoneSaving ? "Saving..." : zoneModal === "create" ? "Create Zone" : "Update"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
