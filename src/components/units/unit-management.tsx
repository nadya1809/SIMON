"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  faAddressBook,
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
import { EmptyState } from "@/components/ui/empty-state";
import { FormDialogActions } from "@/components/ui/form-dialog-actions";
import { FormDialogHeader } from "@/components/ui/form-dialog-header";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { FilterActions, ModuleFilters } from "@/components/ui/module-filters";
import {
  ModulePagination,
  ModuleTableSection
} from "@/components/ui/module-table-section";
import { Textarea } from "@/components/ui/textarea";
import { applyServerFormErrors, getApiErrorMessage } from "@/lib/form-api";
import type { PaginatedData } from "@/lib/pagination";
import type { UnitFormValues } from "@/lib/validations/unit";
import { unitSchema } from "@/lib/validations/unit";

type UnitItem = {
  id: string;
  name: string;
  description: string | null;
  officers: Array<{
    id: string;
    name: string;
  }>;
  _count: {
    officers: number;
  };
};

type UnitManagementProps = {
  initialUnits: PaginatedData<UnitItem>;
  userName: string;
  role: string;
};

export function UnitManagement({
  initialUnits,
  role
}: UnitManagementProps) {
  const [sortBy, setSortBy] = useState<"name" | "officers" | "description">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [units, setUnits] = useState<UnitItem[]>(initialUnits.data);
  const [page, setPage] = useState(initialUnits.meta.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialUnits.meta.rowsPerPage);
  const [totalItems, setTotalItems] = useState(initialUnits.meta.totalItems);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
  const [pendingSubmitValues, setPendingSubmitValues] = useState<UnitFormValues | null>(
    null
  );
  const [confirmingUnit, setConfirmingUnit] = useState<UnitItem | null>(null);
  const [viewingUnit, setViewingUnit] = useState<UnitItem | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasMountedRef = useRef(false);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  const { register, handleSubmit, reset, formState, setError } = form;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  const loadUnits = useCallback(async (nextPage = page, nextRowsPerPage = rowsPerPage) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      rowsPerPage: String(nextRowsPerPage),
      sortBy,
      sortDirection
    });
    const response = await fetch(`/api/units?${params.toString()}`);
    const result = (await response.json()) as {
      message?: string;
      data?: UnitItem[];
      meta?: PaginatedData<UnitItem>["meta"];
    };

    if (!response.ok || !result.data || !result.meta) {
      toast.error(getApiErrorMessage(result, "Gagal memuat daftar unit."));
      return;
    }

    setUnits(result.data);
    setPage(result.meta.page);
    setRowsPerPage(result.meta.rowsPerPage);
    setTotalItems(result.meta.totalItems);
  }, [page, rowsPerPage, sortBy, sortDirection]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    void loadUnits(page, rowsPerPage);
  }, [loadUnits, page, rowsPerPage]);

  function toggleSort(nextSortBy: "name" | "officers" | "description") {
    if (sortBy === nextSortBy) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection("asc");
  }

  function startCreateMode() {
    setIsFormDialogOpen(true);
    setEditingUnit(null);
    reset({ name: "", description: "" });
  }

  function startEditMode(unit: UnitItem) {
    setIsFormDialogOpen(true);
    setEditingUnit(unit);
    reset({
      name: unit.name,
      description: unit.description ?? ""
    });
  }

  async function onSubmit(values: UnitFormValues) {
    const endpoint = editingUnit
      ? `/api/units/${editingUnit.id}`
      : "/api/units";
    const method = editingUnit ? "PATCH" : "POST";

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
        data?: UnitItem;
        errors?: Record<string, string[] | undefined>;
      };

      if (!response.ok || !result.data) {
        applyServerFormErrors(setError, result.errors);
        setIsFormDialogOpen(true);
        toast.error(
          getApiErrorMessage(
            result,
            editingUnit
              ? "Gagal memperbarui unit. Periksa kembali nama dan deskripsi unit."
              : "Gagal menambahkan unit. Periksa kembali nama dan deskripsi unit."
          )
        );
        return;
      }

      const nextUnit = result.data;

      if (editingUnit) {
        toast.success(
          result.message || `Unit "${nextUnit.name}" berhasil diperbarui.`
        );
      } else {
        toast.success(
          result.message || `Unit "${nextUnit.name}" berhasil ditambahkan.`
        );
      }

      await loadUnits(editingUnit ? page : 1, rowsPerPage);
      setEditingUnit(null);
      setIsFormDialogOpen(false);
      reset({ name: "", description: "" });
    });
  }

  async function deleteUnit(unit: UnitItem) {
    setDeletingUnitId(unit.id);

    try {
      const response = await fetch(`/api/units/${unit.id}`, {
        method: "DELETE"
      });

      const result = (await response.json()) as {
        message: string;
      };

      if (!response.ok) {
        toast.error(result.message || "Gagal menghapus unit.");
        return;
      }

      if (editingUnit?.id === unit.id) {
        startCreateMode();
      }

      const nextPage = units.length === 1 && page > 1 ? page - 1 : page;
      await loadUnits(nextPage, rowsPerPage);

      toast.success(result.message || "Unit berhasil dihapus.");
    } finally {
      setDeletingUnitId(null);
    }
  }

  return (
    <DashboardShell
      title="Master Data Unit"
      description="Kelola unit kerja yang akan dipakai untuk pengelompokan petugas PST dan analisis dashboard per unit."
      role={role}
    >
      <section className="space-y-5">
        <ModuleFilters>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Direktori unit kerja
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Gunakan struktur unit yang rapi agar dashboard dan penilaian lebih mudah dibaca.
            </p>
          </div>
          <FilterActions>
            <Button icon={faPlus} onClick={startCreateMode}>
              Tambah Unit
            </Button>
          </FilterActions>
        </ModuleFilters>

        <ModuleTableSection
          title="Daftar unit"
          description={`${units.length} unit tercatat di sistem.`}
          headers={[
            {
              key: "name",
              label: "Nama Unit",
              sortable: true,
              sortDirection: sortBy === "name" ? sortDirection : null,
              onSort: () => toggleSort("name")
            },
            {
              key: "officers",
              label: "Petugas",
              sortable: true,
              sortDirection: sortBy === "officers" ? sortDirection : null,
              onSort: () => toggleSort("officers")
            },
            {
              key: "description",
              label: "Deskripsi",
              sortable: true,
              sortDirection: sortBy === "description" ? sortDirection : null,
              onSort: () => toggleSort("description")
            },
            "Aksi"
          ]}
          isEmpty={!units.length}
          emptyState={
            <EmptyState
              title="Belum ada unit"
              description="Tambahkan unit pertama agar pengelompokan petugas PST bisa mulai digunakan."
              icon="U"
              actionLabel="Tambah Unit"
              onAction={startCreateMode}
            />
          }
        >
          {units.map((unit) => {
            const officerNames = unit.officers.map((officer) => officer.name);
            return (
              <tr key={unit.id} className="border-t border-[var(--border)]">
                <td className="px-5 py-4">
                  <div>
                    <p className="font-semibold">{unit.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Unit kerja untuk pengelompokan petugas PST
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-2">
                    <Badge variant="default">{unit._count.officers} petugas</Badge>
                  </div>
                </td>
                <td className="px-5 py-4 text-[var(--muted)]">
                  {unit.description || "-"}
                </td>
                <td className="px-5 py-4">
                  <ActionMenu
                    triggerLabel={
                      officerNames.length
                        ? `Aksi unit ${unit.name} untuk petugas ${officerNames.join(", ")}`
                        : `Aksi unit ${unit.name}`
                    }
                    items={[
                      {
                        label: "Lihat petugas bertugas",
                        icon: faAddressBook,
                        onClick: () => setViewingUnit(unit)
                      },
                      {
                        label: "Edit unit",
                        icon: faPenToSquare,
                        onClick: () => startEditMode(unit)
                      },
                      {
                        label:
                          deletingUnitId === unit.id
                            ? "Menghapus..."
                            : "Hapus unit",
                        icon: faTrash,
                        variant: "danger",
                        disabled: deletingUnitId === unit.id,
                        onClick: () => setConfirmingUnit(unit)
                      }
                    ]}
                  />
                </td>
              </tr>
            );
          })}
          </ModuleTableSection>

        <ModulePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setPage(1);
          }}
        />
      </section>

      <ModalDialog
        open={isFormDialogOpen}
        onClose={() => {
          setIsFormDialogOpen(false);
          setEditingUnit(null);
          reset({ name: "", description: "" });
        }}
        title={editingUnit ? "Edit unit" : "Tambah unit baru"}
        description="Unit akan dipakai di modul petugas dan dashboard per unit."
      >
          <FormDialogHeader isEditing={Boolean(editingUnit)} onCancelEdit={startCreateMode} />

          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => {
              setIsFormDialogOpen(false);
              setPendingSubmitValues(values);
            })}
          >
            <FormSection
              title="Informasi unit"
              description="Isi data inti unit kerja yang akan digunakan di seluruh modul monitoring."
            >
              <FormField
                label="Nama unit"
                error={formState.errors.name?.message}
                hint="Contoh: PST Utama, Layanan Statistik, atau Front Office."
              >
                <Input
                  placeholder="Masukkan nama unit"
                  maxLength={100}
                  autoCapitalize="words"
                  {...register("name")}
                />
              </FormField>

              <FormField
                label="Deskripsi"
                error={formState.errors.description?.message}
                hint="Opsional. Bisa dipakai untuk menjelaskan fungsi unit."
              >
                <Textarea
                  placeholder="Tulis deskripsi singkat unit"
                  maxLength={255}
                  {...register("description")}
                />
              </FormField>
            </FormSection>

            <FormDialogActions
              isPending={isPending}
              isEditing={Boolean(editingUnit)}
              createLabel="Tambah unit"
              onCancel={() => {
                setIsFormDialogOpen(false);
                setEditingUnit(null);
                reset({ name: "", description: "" });
              }}
            />
          </form>
      </ModalDialog>

      <ModalDialog
        open={Boolean(viewingUnit)}
        onClose={() => setViewingUnit(null)}
        title={
          viewingUnit
            ? `Petugas bertugas di ${viewingUnit.name}`
            : "Petugas bertugas"
        }
        description="Daftar ini menampilkan seluruh petugas yang saat ini terhubung ke unit terpilih."
      >
        <div className="space-y-3">
          {viewingUnit?.officers.length ? (
            viewingUnit.officers.map((officer, index) => (
              <div
                key={officer.id}
                className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Petugas {index + 1}
                </p>
                <p className="mt-1 font-semibold text-[var(--foreground)]">
                  {officer.name}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-sm text-[var(--muted)]">
              Belum ada petugas yang bertugas pada unit ini.
            </div>
          )}
        </div>
      </ModalDialog>

      <ConfirmDialog
        open={Boolean(pendingSubmitValues)}
        title={editingUnit ? "Simpan perubahan unit?" : "Tambah unit baru?"}
        description={
          editingUnit
            ? "Perubahan unit akan langsung dipakai di seluruh modul terkait."
            : "Unit baru akan langsung tersedia untuk pemetaan petugas PST."
        }
        variant="primary"
        icon={editingUnit ? faPenToSquare : faPlus}
        confirmLabel={editingUnit ? "Ya, simpan" : "Ya, tambah"}
        isLoading={isPending}
        onClose={() => {
          if (!isPending) {
            setPendingSubmitValues(null);
            setIsFormDialogOpen(true);
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
        open={Boolean(confirmingUnit)}
        title={
          confirmingUnit
            ? `Hapus unit ${confirmingUnit.name}?`
            : "Hapus unit?"
        }
        description="Unit hanya bisa dihapus jika belum memiliki petugas terdaftar."
        isLoading={
          Boolean(confirmingUnit) && deletingUnitId === confirmingUnit?.id
        }
        onClose={() => {
          if (!deletingUnitId) {
            setConfirmingUnit(null);
          }
        }}
        onConfirm={() => {
          if (confirmingUnit) {
            void deleteUnit(confirmingUnit).finally(() => setConfirmingUnit(null));
          }
        }}
      />
    </DashboardShell>
  );
}
