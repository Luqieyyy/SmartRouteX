"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
} from "@/services/hubs";
import {
  getZones,
  createZone,
  updateZone,
  deleteZone,
  getZoneBoundaries,
} from "@/services/zones";
import type { Hub, Zone, AdminRole, PaginatedResponse, ZoneBoundary } from "@/types";
import { useHubContext } from "@/lib/hub-context";
import { getGoogleMapsApiKey } from "@/lib/mapHelpers";
import { ZONE_COLORS, polygonsIntersect } from "@/components/maps/ZoneDrawingMap";
import type { LatLng, NeighbourZone } from "@/components/maps/ZoneDrawingMap";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  MapPinned,
  Hexagon,
} from "lucide-react";

/* Lazy-load the map component (SSR-incompatible) */
const ZoneDrawingMap = dynamic(
  () => import("@/components/maps/ZoneDrawingMap"),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-50 rounded-lg animate-pulse" /> }
);

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
  color_code: string;
  zone_boundary: LatLng[] | null;
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
  color_code: ZONE_COLORS[0],
  zone_boundary: null,
};

/* ── Component ─────────────────────────────────────────────── */

export default function SettingsPage() {
  /* ── Auth / role (from shared hub context) ───────────────── */
  const { role, activeHubId, activeHub, refreshKey } = useHubContext();

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
  }, [hubSearch, hubPage, isSuperAdmin, refreshKey]);

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
  const [hubZoneBoundaries, setHubZoneBoundaries] = useState<ZoneBoundary[]>([]);

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
  }, [zoneSearch, zonePage, refreshKey]);

  useEffect(() => {
    if (tab === "zones") fetchZones();
  }, [tab, fetchZones]);

  /* Fetch all zone boundaries for the hub (for map overlay + overlap check) */
  useEffect(() => {
    if (tab !== "zones") return;
    const hubId = activeHubId ?? undefined;
    getZoneBoundaries(hubId)
      .then(setHubZoneBoundaries)
      .catch(() => setHubZoneBoundaries([]));
  }, [tab, activeHubId, refreshKey]);

  useEffect(() => {
    setZonePage(1);
  }, [zoneSearch]);

  /* Zone modal helpers */
  function openZoneCreate() {
    // Pick a random color from the palette
    const usedColors = (zoneData?.data ?? []).map((z) => z.color_code);
    const available = ZONE_COLORS.filter((c) => !usedColors.includes(c));
    const nextColor = available.length > 0 ? available[0] : ZONE_COLORS[Math.floor(Math.random() * ZONE_COLORS.length)];

    setZoneForm({
      ...emptyZoneForm,
      hub_id: activeHubId ? String(activeHubId) : "",
      color_code: nextColor,
    });
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
      color_code: zone.color_code || ZONE_COLORS[0],
      zone_boundary: zone.zone_boundary ?? null,
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

    /* ── Frontend polygon overlap check ── */
    if (zoneForm.zone_boundary && zoneForm.zone_boundary.length >= 3) {
      const editingId = zoneSelected?.id;
      const siblings = hubZoneBoundaries.filter(
        (z) => z.id !== editingId && z.zone_boundary.length >= 3,
      );
      for (const other of siblings) {
        if (polygonsIntersect(zoneForm.zone_boundary, other.zone_boundary)) {
          errs.zone_boundary = `Boundary overlaps with zone "${other.name}". Adjust vertices to avoid overlap.` as string;
          break;
        }
      }
    }

    if (Object.keys(errs).length) {
      setZoneErrors(errs);
      return;
    }

    setZoneSaving(true);
    try {
      if (zoneModal === "create") {
        const payload = {
          name: zoneForm.name.trim(),
          code: zoneForm.code.trim().toUpperCase(),
          is_active: zoneForm.is_active === "1",
          color_code: zoneForm.color_code,
          zone_boundary: zoneForm.zone_boundary,
          hub_id: isSuperAdmin && zoneForm.hub_id ? Number(zoneForm.hub_id) : undefined,
        };
        const res = await createZone(payload);
        setToast(res.message || "Zone created.");
      } else if (zoneSelected) {
        await updateZone(zoneSelected.id, {
          name: zoneForm.name.trim(),
          code: zoneForm.code.trim().toUpperCase(),
          is_active: zoneForm.is_active === "1",
          color_code: zoneForm.color_code,
          zone_boundary: zoneForm.zone_boundary,
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
      key: "color_code",
      label: "",
      className: "w-8",
      render: (z) => (
        <div
          className="w-4 h-4 rounded-full border border-gray-200"
          style={{ backgroundColor: z.color_code || "#3B82F6" }}
          title={z.color_code}
        />
      ),
    },
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
      key: "zone_boundary",
      label: "Boundary",
      render: (z) => {
        const hasB = z.zone_boundary && z.zone_boundary.length >= 3;
        return (
          <Badge className={hasB ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"}>
            {hasB ? (
              <span className="flex items-center gap-1">
                <Hexagon size={10} />
                {z.zone_boundary!.length} pts
              </span>
            ) : (
              "No boundary"
            )}
          </Badge>
        );
      },
    },
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
         Zone Modal (with Polygon Drawing)
         ══════════════════════════════════════════════════════════ */}
      <Modal
        open={zoneModal !== null}
        onClose={closeZoneModal}
        title={zoneModal === "create" ? "Create Zone" : "Edit Zone"}
        wide
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

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status"
              value={zoneForm.is_active}
              onChange={(e) => updateZoneField("is_active", e.target.value)}
              options={[
                { value: "1", label: "Active" },
                { value: "0", label: "Inactive" },
              ]}
            />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Zone Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {ZONE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setZoneForm((p) => ({ ...p, color_code: c }))}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      zoneForm.color_code === c
                        ? "border-gray-900 scale-110"
                        : "border-transparent hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Zone Boundary Map ──────────────────────────────── */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Zone Boundary (Polygon)
            </label>
            {(() => {
              const mapsKey = getGoogleMapsApiKey();
              if (!mapsKey) {
                return (
                  <div className="h-[200px] bg-gray-50 rounded-lg flex items-center justify-center text-sm text-gray-400">
                    Google Maps API key not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local
                  </div>
                );
              }
              return (
                <ZoneDrawingMap
                  apiKey={mapsKey}
                  boundary={zoneForm.zone_boundary}
                  onBoundaryChange={(b) =>
                    setZoneForm((p) => ({ ...p, zone_boundary: b }))
                  }
                  hubCenter={
                    activeHub?.latitude && activeHub?.longitude
                      ? { lat: activeHub.latitude, lng: activeHub.longitude }
                      : undefined
                  }
                  color={zoneForm.color_code}
                  zoneName={zoneForm.name || undefined}
                  otherZones={
                    hubZoneBoundaries
                      .filter((z) => z.id !== zoneSelected?.id && z.zone_boundary.length >= 3)
                      .map((z) => ({
                        id: z.id,
                        name: z.name,
                        color_code: z.color_code,
                        zone_boundary: z.zone_boundary,
                      }))
                  }
                />
              );
            })()}
            {zoneErrors.zone_boundary && (
              <p className="text-xs text-red-600 mt-1">{zoneErrors.zone_boundary}</p>
            )}
          </div>
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
