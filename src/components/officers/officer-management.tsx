"use client";

import { useDeferredValue, useState, useTransition } from "react";
import {
  faClipboardList,
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
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import {
  officerJabatanOptions,
  officerSchema,
  type OfficerFormValues
} from "@/lib/validations/officer";
import { formatAverageScore } from "@/lib/scoring";

type UnitOption = {
  id: string;
  name: string;
};

type OfficerItem = {
  id: string;
  nip: string;
  name: string;
  jabatan: string | null;
  unitId: string | null;
  isActive: boolean;
  unit: UnitOption | null;
};

type OfficerAssessmentHistoryItem = {
  id: string;
  assessmentDate: string;
  status: "PRESENT" | "ABSENT";
  averageScore: number | null;
  notes: string | null;
  assessor: {
    id: string;
    name: string | null;
    role: string;
  };
  scores: Array<{
    id: string;
    score: number;
    criteria: {
      id: string;
      name: string;
      sortOrder: number;
    };
  }>;
};

type OfficerHistoryResponse = {
  officer: {
    id: string;
    name: string;
    nip: string;
    unit: UnitOption | null;
  };
  filters: {
    from: string;
    to: string;
  };
  assessments: OfficerAssessmentHistoryItem[];
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
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<OfficerItem | null>(null);
  const [pendingSubmitValues, setPendingSubmitValues] =
    useState<OfficerFormValues | null>(null);
  const [confirmingOfficer, setConfirmingOfficer] = useState<OfficerItem | null>(
    null
  );
  const [deletingOfficerId, setDeletingOfficerId] = useState<string | null>(null);
  const [historyOfficer, setHistoryOfficer] = useState<OfficerItem | null>(null);
  const [historyItems, setHistoryItems] = useState<OfficerAssessmentHistoryItem[]>([]);
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isActiveValue, setIsActiveValue] = useState(true);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const form = useForm<OfficerFormValues>({
    resolver: zodResolver(officerSchema),
    defaultValues: {
      nip: "",
      name: "",
      jabatan: "",
      unitId: "",
      isActive: true
    }
  });

  const { register, handleSubmit, reset, formState, setValue } = form;

  function resetForm() {
    setIsFormDialogOpen(false);
    setEditingOfficer(null);
    setIsActiveValue(true);
    reset({
      nip: "",
      name: "",
      jabatan: "",
      unitId: "",
      isActive: true
    });
  }

  function startEditMode(officer: OfficerItem) {
    setIsFormDialogOpen(true);
    setEditingOfficer(officer);
    setIsActiveValue(officer.isActive);
    reset({
      nip: officer.nip,
      name: officer.name,
      jabatan: officerJabatanOptions.includes(
        officer.jabatan as (typeof officerJabatanOptions)[number]
      )
        ? (officer.jabatan as (typeof officerJabatanOptions)[number])
        : "",
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

  const totalPages = Math.max(1, Math.ceil(filteredOfficers.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const displayedOfficers = filteredOfficers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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

  async function loadOfficerHistory(
    officer: OfficerItem,
    filters?: {
      from?: string;
      to?: string;
    }
  ) {
    setHistoryOfficer(officer);
    setIsHistoryLoading(true);

    try {
      const params = new URLSearchParams();

      if (filters?.from) {
        params.set("from", filters.from);
      }

      if (filters?.to) {
        params.set("to", filters.to);
      }

      const query = params.toString();
      const response = await fetch(
        `/api/officers/${officer.id}/assessments${query ? `?${query}` : ""}`
      );

      const result = (await response.json()) as {
        message?: string;
        data?: OfficerHistoryResponse;
      };

      if (!response.ok || !result.data) {
        toast.error(result.message || "Gagal memuat riwayat penilaian.");
        return;
      }

      setHistoryOfficer(officer);
      setHistoryItems(result.data.assessments);
      setHistoryFrom(result.data.filters.from);
      setHistoryTo(result.data.filters.to);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  function formatDateLabel(value: string) {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(value));
  }

  return (
    <DashboardShell
      title="Master Data Petugas PST"
      description="Kelola daftar petugas PST yang akan dinilai. Modul ini mendukung pencarian, filter unit, status aktif, dan pengeditan cepat untuk skala data yang lebih besar."
      role={role}
    >
      <section className="space-y-5">
          <FilterToolbar>
            <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Cari petugas">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama atau NIP"
              />
            </FormField>

            <FormField label="Filter unit">
              <Select
                value={unitFilter}
                onChange={(event) => {
                  setUnitFilter(event.target.value);
                  setPage(1);
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
                  setPage(1);
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
            <Button
              icon={faPlus}
              onClick={() => {
                resetForm();
                setIsFormDialogOpen(true);
              }}
            >
              Tambah Petugas
            </Button>
          </FilterToolbar>

          <DataTableShell
            title="Daftar petugas PST"
            description={`${filteredOfficers.length} data sesuai filter aktif.`}
          >
            <Table
              headers={["NIP", "Nama", "Unit", "Jabatan", "Status", "Aksi"]}
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
                      {officer.jabatan || "-"}
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
                            label: "Riwayat penilaian",
                            icon: faClipboardList,
                            onClick: () => {
                              setHistoryOfficer(officer);
                              setHistoryItems([]);
                              setHistoryFrom("");
                              setHistoryTo("");
                              void loadOfficerHistory(officer, {
                                from: "",
                                to: ""
                              });
                            }
                          },
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
                      title={
                        officers.length
                          ? "Tidak ada hasil untuk filter ini"
                          : "Belum ada petugas PST"
                      }
                      description={
                        officers.length
                          ? "Ubah kata kunci, filter unit, atau status aktif agar data lain muncul."
                          : "Tambahkan petugas baru agar modul penilaian dan jadwal bisa mulai dipakai."
                      }
                      icon="P"
                      actionLabel="Tambah Petugas"
                      onAction={() => {
                        resetForm();
                        setIsFormDialogOpen(true);
                      }}
                    />
                  </td>
                </tr>
              )}
            </Table>
          </DataTableShell>

          {filteredOfficers.length ? (
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              totalItems={filteredOfficers.length}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(rows) => {
                setRowsPerPage(rows);
                setPage(1);
              }}
            />
          ) : null}
      </section>

      <ModalDialog
        open={Boolean(historyOfficer)}
        onClose={() => {
          if (!isHistoryLoading) {
            setHistoryOfficer(null);
            setHistoryItems([]);
            setHistoryFrom("");
            setHistoryTo("");
          }
        }}
        title={
          historyOfficer
            ? `Riwayat penilaian ${historyOfficer.name}`
            : "Riwayat penilaian petugas"
        }
        description="Lihat detail penilaian harian per petugas, termasuk skor tiap kriteria dan rata-rata per hari."
        className="max-w-6xl"
      >
        {historyOfficer ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-sm)]">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  Petugas
                </p>
                <p className="mt-1 font-semibold">{historyOfficer.name}</p>
                <p className="text-sm text-[var(--muted)]">NIP: {historyOfficer.nip}</p>
              </div>
              <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-sm)]">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  Unit
                </p>
                <p className="mt-1 font-semibold">
                  {historyOfficer.unit?.name ?? "Belum ditentukan"}
                </p>
              </div>
              <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-sm)]">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  Total data
                </p>
                <p className="mt-1 font-semibold">{historyItems.length} hari penilaian</p>
              </div>
            </div>

            <form
              className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-[1fr_1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                void loadOfficerHistory(historyOfficer, {
                  from: historyFrom,
                  to: historyTo
                });
              }}
            >
              <FormField label="Dari tanggal">
                <Input
                  type="date"
                  value={historyFrom}
                  onChange={(event) => setHistoryFrom(event.target.value)}
                />
              </FormField>
              <FormField label="Sampai tanggal">
                <Input
                  type="date"
                  value={historyTo}
                  onChange={(event) => setHistoryTo(event.target.value)}
                />
              </FormField>
              <div className="flex items-end gap-3">
                <Button type="submit" disabled={isHistoryLoading}>
                  {isHistoryLoading ? "Memuat..." : "Terapkan"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setHistoryFrom("");
                    setHistoryTo("");
                    void loadOfficerHistory(historyOfficer, {
                      from: "",
                      to: ""
                    });
                  }}
                  disabled={isHistoryLoading}
                >
                  Reset
                </Button>
              </div>
            </form>

            <div className="rounded-[var(--radius-card)] border border-[var(--border)]">
              <Table
                headers={[
                  "Tanggal",
                  "Status",
                  "Skor per kriteria",
                  "Rata-rata",
                  "Penilai",
                  "Catatan"
                ]}
              >
                {historyItems.length ? (
                  historyItems.map((item) => (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="px-5 py-4 font-medium">
                        {formatDateLabel(item.assessmentDate)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={item.status === "PRESENT" ? "success" : "warning"}>
                          {item.status === "PRESENT" ? "Hadir" : "Tidak Hadir"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {item.status === "ABSENT"
                          ? "-"
                          : item.scores
                              .map((score) => `${score.criteria.name}: ${score.score}`)
                              .join(", ")}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {formatAverageScore(item.averageScore)}
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {item.assessor.name ?? "Pengguna"} ({item.assessor.role})
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {item.notes || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-8">
                      <EmptyState
                        title={
                          isHistoryLoading
                            ? "Sedang memuat riwayat"
                            : "Belum ada riwayat penilaian"
                        }
                        description={
                          isHistoryLoading
                            ? "Mohon tunggu sebentar sementara data penilaian harian diambil."
                            : "Coba ubah rentang tanggal atau tambahkan penilaian harian untuk petugas ini."
                        }
                        icon="R"
                      />
                    </td>
                  </tr>
                )}
              </Table>
            </div>
          </div>
        ) : null}
      </ModalDialog>

      <ModalDialog
        open={isFormDialogOpen}
        onClose={resetForm}
        title={editingOfficer ? "Edit petugas" : "Tambah petugas baru"}
        description="Gunakan NIP unik untuk setiap petugas. Status nonaktif akan mempertahankan histori data lama."
        className="max-w-4xl"
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

          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => {
              setPendingSubmitValues(values);
            })}
          >
            <FormSection
              title="Identitas petugas"
              description="Lengkapi identitas dasar petugas dan hubungkan ke unit jika sudah tersedia."
            >
              <FormField
                label="NIP"
                hint="Harus unik untuk setiap petugas dan hanya boleh berisi angka."
                error={formState.errors.nip?.message}
              >
                <Input
                  placeholder="Masukkan NIP petugas"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  {...register("nip")}
                />
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
                label="Jabatan"
                hint="Pilih jabatan petugas dari daftar yang tersedia."
                error={formState.errors.jabatan?.message}
              >
                <Select {...register("jabatan")}>
                  <option value="">Belum ditentukan</option>
                  {officerJabatanOptions.map((jabatan) => (
                    <option key={jabatan} value={jabatan}>
                      {jabatan}
                    </option>
                  ))}
                </Select>
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
                  className="flex w-full items-center justify-between rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm shadow-[var(--shadow-sm)]"
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

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Menyimpan..."
                  : editingOfficer
                    ? "Simpan perubahan"
                    : "Tambah petugas"}
              </Button>
            </div>
          </form>
      </ModalDialog>

      <ConfirmDialog
        open={Boolean(pendingSubmitValues)}
        title={
          editingOfficer ? "Simpan perubahan petugas?" : "Tambah petugas baru?"
        }
        description={
          editingOfficer
            ? "Perubahan data petugas akan langsung diperbarui di sistem."
            : "Petugas baru akan langsung tersedia di modul penilaian."
        }
        variant="primary"
        icon={editingOfficer ? faPenToSquare : faPlus}
        confirmLabel={editingOfficer ? "Ya, simpan" : "Ya, tambah"}
        isLoading={isPending}
        onClose={() => {
          if (!isPending) {
            setPendingSubmitValues(null);
          }
        }}
        onConfirm={() => {
          if (pendingSubmitValues) {
            void onSubmit(pendingSubmitValues);
            setPendingSubmitValues(null);
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmingOfficer)}
        title={
          confirmingOfficer
            ? `Hapus petugas ${confirmingOfficer.name}?`
            : "Hapus petugas?"
        }
        description="Semua histori penilaian harian dan reward atau punishment milik petugas ini juga akan ikut dihapus permanen."
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
