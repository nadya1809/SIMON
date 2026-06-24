"use client";

import { useDeferredValue, useState, useTransition } from "react";
import {
  faPenToSquare,
  faPlus,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormField } from "@/components/forms/form-field";
import { ActionMenu } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { officerSchema, type OfficerFormValues } from "@/lib/validations/officer";

type UnitOption = {
  id: string;
  name: string;
};

type OfficerItem = {
  id: string;
  nip: string;
  name: string;
  position: string | null;
  unitId: string | null;
  isActive: boolean;
  unit: UnitOption | null;
};

type OfficerManagementProps = {
  initialOfficers: OfficerItem[];
  units: UnitOption[];
  userName: string;
  role: string;
};

type SortOption = "name" | "nip" | "unit";
type StatusFilter = "all" | "active" | "inactive";

export function OfficerManagement({
  initialOfficers,
  units,
  role
}: OfficerManagementProps) {
  const [officers, setOfficers] = useState<OfficerItem[]>(initialOfficers);
  const [editingOfficer, setEditingOfficer] = useState<OfficerItem | null>(null);
  const [confirmingOfficer, setConfirmingOfficer] = useState<OfficerItem | null>(
    null
  );
  const [deletingOfficerId, setDeletingOfficerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [visibleRows, setVisibleRows] = useState(10);
  const [isActiveValue, setIsActiveValue] = useState(true);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const form = useForm<OfficerFormValues>({
    resolver: zodResolver(officerSchema),
    defaultValues: {
      nip: "",
      name: "",
      position: "",
      unitId: "",
      isActive: true
    }
  });

  const { register, handleSubmit, reset, formState, setValue } = form;

  function resetForm() {
    setEditingOfficer(null);
    setIsActiveValue(true);
    reset({
      nip: "",
      name: "",
      position: "",
      unitId: "",
      isActive: true
    });
  }

  function startEditMode(officer: OfficerItem) {
    setEditingOfficer(officer);
    setIsActiveValue(officer.isActive);
    reset({
      nip: officer.nip,
      name: officer.name,
      position: officer.position ?? "",
      unitId: officer.unitId ?? "",
      isActive: officer.isActive
    });
  }

  const filteredOfficers = officers
    .filter((officer) => {
      const normalizedSearch = deferredSearch.trim().toLowerCase();

      if (
        normalizedSearch &&
        !`${officer.name} ${officer.nip}`.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (unitFilter !== "all" && officer.unitId !== unitFilter) {
        return false;
      }

      if (statusFilter === "active" && !officer.isActive) {
        return false;
      }

      if (statusFilter === "inactive" && officer.isActive) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "nip") {
        return a.nip.localeCompare(b.nip);
      }

      if (sortBy === "unit") {
        return (a.unit?.name ?? "").localeCompare(b.unit?.name ?? "");
      }

      return a.name.localeCompare(b.name);
    });

  const displayedOfficers = filteredOfficers.slice(0, visibleRows);

  async function onSubmit(values: OfficerFormValues) {
    const endpoint = editingOfficer
      ? `/api/officers/${editingOfficer.id}`
      : "/api/officers";
    const method = editingOfficer ? "PATCH" : "POST";

    startTransition(async () => {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const result = (await response.json()) as {
        message: string;
        data?: OfficerItem;
      };

      if (!response.ok || !result.data) {
        toast.error(result.message || "Gagal menyimpan data petugas.");
        return;
      }

      const nextOfficer = result.data;

      if (editingOfficer) {
        setOfficers((current) =>
          current.map((item) =>
            item.id === nextOfficer.id ? nextOfficer : item
          )
        );
        toast.success("Data petugas berhasil diperbarui.");
      } else {
        setOfficers((current) => [...current, nextOfficer]);
        toast.success("Petugas baru berhasil ditambahkan.");
      }

      resetForm();
    });
  }

  async function deleteOfficer(officer: OfficerItem) {
    setDeletingOfficerId(officer.id);

    try {
      const response = await fetch(`/api/officers/${officer.id}`, {
        method: "DELETE"
      });

      const result = (await response.json()) as {
        message: string;
      };

      if (!response.ok) {
        toast.error(result.message || "Gagal menghapus petugas.");
        return;
      }

      setOfficers((current) => current.filter((item) => item.id !== officer.id));

      if (editingOfficer?.id === officer.id) {
        resetForm();
      }

      toast.success(result.message || "Petugas berhasil dihapus.");
    } finally {
      setDeletingOfficerId(null);
    }
  }

  return (
    <DashboardShell
      title="Master Data Petugas PST"
      description="Kelola daftar petugas PST yang akan dinilai. Modul ini mendukung pencarian, filter unit, status aktif, dan pengeditan cepat untuk skala data yang lebih besar."
      role={role}
    >
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <FilterToolbar>
            <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Cari petugas">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisibleRows(10);
                }}
                placeholder="Cari nama atau NIP"
              />
            </FormField>

            <FormField label="Filter unit">
              <Select
                value={unitFilter}
                onChange={(event) => {
                  setUnitFilter(event.target.value);
                  setVisibleRows(10);
                }}
              >
                <option value="all">Semua unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Status aktif">
              <Select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setVisibleRows(10);
                }}
              >
                <option value="all">Semua status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </Select>
            </FormField>

            <FormField label="Urutkan">
              <Select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
              >
                <option value="name">Nama</option>
                <option value="nip">NIP</option>
                <option value="unit">Unit</option>
              </Select>
            </FormField>
            </div>
            <Button icon={faPlus} onClick={resetForm}>
              Tambah Petugas
            </Button>
          </FilterToolbar>

          <DataTableShell
            title="Daftar petugas PST"
            description={`${filteredOfficers.length} data sesuai filter aktif.`}
          >
            <Table
              headers={["NIP", "Nama", "Unit", "Posisi", "Status", "Aksi"]}
            >
              {displayedOfficers.length ? (
                displayedOfficers.map((officer) => (
                  <tr key={officer.id} className="border-t border-[var(--border)]">
                    <td className="px-5 py-4 font-medium">{officer.nip}</td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold">{officer.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          Detail singkat petugas PST
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)]">
                      {officer.unit?.name ?? "-"}
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)]">
                      {officer.position || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={officer.isActive ? "success" : "warning"}>
                        {officer.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <ActionMenu
                        items={[
                          {
                            label: "Edit petugas",
                            icon: faPenToSquare,
                            onClick: () => startEditMode(officer)
                          },
                          {
                            label:
                              deletingOfficerId === officer.id
                                ? "Menghapus..."
                                : "Hapus petugas",
                            icon: faTrash,
                            variant: "danger",
                            disabled: deletingOfficerId === officer.id,
                            onClick: () => setConfirmingOfficer(officer)
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8">
                    <EmptyState
                      title="Belum ada petugas yang cocok"
                      description="Tambahkan petugas baru atau ubah filter pencarian untuk melihat data lain."
                      icon="P"
                      actionLabel="Tambah Petugas"
                      onAction={resetForm}
                    />
                  </td>
                </tr>
              )}
            </Table>
          </DataTableShell>

          {filteredOfficers.length > displayedOfficers.length ? (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => setVisibleRows((current) => current + 10)}
              >
                Tampilkan lebih banyak
              </Button>
            </div>
          ) : null}
        </div>

        <Dialog
          title={editingOfficer ? "Edit petugas" : "Tambah petugas baru"}
          description="Gunakan NIP unik untuk setiap petugas. Status nonaktif akan mempertahankan histori data lama."
        >
          <div className="mb-4 flex items-center justify-between">
            <Badge variant={editingOfficer ? "warning" : "success"}>
              {editingOfficer ? "Mode edit" : "Mode tambah"}
            </Badge>
            {editingOfficer ? (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Batal edit
              </Button>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormSection
              title="Identitas petugas"
              description="Lengkapi identitas dasar petugas dan hubungkan ke unit jika sudah tersedia."
            >
              <FormField
                label="NIP"
                hint="Harus unik untuk setiap petugas."
                error={formState.errors.nip?.message}
              >
                <Input placeholder="Masukkan NIP petugas" {...register("nip")} />
              </FormField>

              <FormField
                label="Nama petugas"
                error={formState.errors.name?.message}
              >
                <Input
                  placeholder="Masukkan nama lengkap petugas"
                  {...register("name")}
                />
              </FormField>

              <FormField
                label="Posisi"
                hint="Opsional, misalnya Front Office atau Petugas Layanan."
                error={formState.errors.position?.message}
              >
                <Input
                  placeholder="Masukkan posisi petugas"
                  {...register("position")}
                />
              </FormField>

              <FormField
                label="Unit"
                hint="Boleh dikosongkan jika belum ditentukan."
              >
                <Select {...register("unitId")}>
                  <option value="">Belum ditentukan</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </FormSection>

            <FormSection
              title="Status petugas"
              description="Status nonaktif akan mempertahankan histori lama tetapi menyembunyikan petugas dari alur aktif."
            >
              <FormField label="Status petugas">
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = !isActiveValue;
                    setIsActiveValue(nextValue);
                    setValue("isActive", nextValue);
                  }}
                  className="flex w-full items-center justify-between rounded-[var(--radius-control)] border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-sm)]"
                >
                  <span>
                    {isActiveValue
                      ? "Petugas aktif dan bisa dipakai untuk penilaian"
                      : "Petugas nonaktif, histori tetap dipertahankan"}
                  </span>
                  <Badge variant={isActiveValue ? "success" : "warning"}>
                    {isActiveValue ? "Aktif" : "Nonaktif"}
                  </Badge>
                </button>
                <input type="hidden" value={isActiveValue ? "true" : "false"} />
              </FormField>
            </FormSection>

            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending
                ? "Menyimpan..."
                : editingOfficer
                  ? "Simpan perubahan"
                  : "Tambah petugas"}
            </Button>
          </form>
        </Dialog>
      </section>

      <ConfirmDialog
        open={Boolean(confirmingOfficer)}
        title={
          confirmingOfficer
            ? `Hapus petugas ${confirmingOfficer.name}?`
            : "Hapus petugas?"
        }
        description="Penghapusan hanya diizinkan jika petugas belum memiliki histori penilaian atau reward dan punishment."
        isLoading={
          Boolean(confirmingOfficer) &&
          deletingOfficerId === confirmingOfficer?.id
        }
        onClose={() => {
          if (!deletingOfficerId) {
            setConfirmingOfficer(null);
          }
        }}
        onConfirm={() => {
          if (confirmingOfficer) {
            void deleteOfficer(confirmingOfficer).finally(() =>
              setConfirmingOfficer(null)
            );
          }
        }}
      />
    </DashboardShell>
  );
}
