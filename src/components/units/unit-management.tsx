"use client";

import { useState, useTransition } from "react";
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
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Table } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { UnitFormValues } from "@/lib/validations/unit";
import { unitSchema } from "@/lib/validations/unit";

type UnitItem = {
  id: string;
  name: string;
  description: string | null;
  _count: {
    officers: number;
  };
};

type UnitManagementProps = {
  initialUnits: UnitItem[];
  userName: string;
  role: string;
};

export function UnitManagement({
  initialUnits,
  role
}: UnitManagementProps) {
  const [units, setUnits] = useState<UnitItem[]>(initialUnits);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
  const [confirmingUnit, setConfirmingUnit] = useState<UnitItem | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  const { register, handleSubmit, reset, formState } = form;

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
      };

      if (!response.ok || !result.data) {
        toast.error(result.message || "Gagal menyimpan unit.");
        return;
      }

      const nextUnit = result.data;

      if (editingUnit) {
        setUnits((current) =>
          current
            .map((item) => (item.id === nextUnit.id ? nextUnit : item))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        toast.success("Data unit berhasil diperbarui.");
      } else {
        setUnits((current) =>
          [...current, nextUnit].sort((a, b) => a.name.localeCompare(b.name))
        );
        toast.success("Unit baru berhasil ditambahkan.");
      }

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

      setUnits((current) => current.filter((item) => item.id !== unit.id));

      if (editingUnit?.id === unit.id) {
        startCreateMode();
      }

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
        <FilterToolbar>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Direktori unit kerja
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Gunakan struktur unit yang rapi agar dashboard dan penilaian lebih mudah dibaca.
            </p>
          </div>
          <Button icon={faPlus} onClick={startCreateMode}>
            Tambah Unit
          </Button>
        </FilterToolbar>

        <DataTableShell
          title="Daftar unit"
          description={`${units.length} unit tercatat di sistem.`}
        >
          <Table headers={["Nama Unit", "Jumlah Petugas", "Deskripsi", "Aksi"]}>
            {units.length ? (
              units.map((unit) => (
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
                    <Badge variant="default">{unit._count.officers} petugas</Badge>
                  </td>
                  <td className="px-5 py-4 text-[var(--muted)]">
                    {unit.description || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <ActionMenu
                      items={[
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
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-8">
                  <EmptyState
                    title="Belum ada unit"
                    description="Tambahkan unit pertama agar pengelompokan petugas PST bisa mulai digunakan."
                    icon="U"
                    actionLabel="Tambah Unit"
                    onAction={startCreateMode}
                  />
                </td>
              </tr>
            )}
          </Table>
        </DataTableShell>
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
          <div className="mb-4 flex items-center justify-between">
            <Badge variant={editingUnit ? "warning" : "success"}>
              {editingUnit ? "Mode edit" : "Mode tambah"}
            </Badge>
            {editingUnit ? (
              <Button variant="ghost" size="sm" onClick={startCreateMode}>
                Batal edit
              </Button>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
                  {...register("description")}
                />
              </FormField>
            </FormSection>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsFormDialogOpen(false);
                  setEditingUnit(null);
                  reset({ name: "", description: "" });
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Menyimpan..."
                  : editingUnit
                    ? "Simpan perubahan"
                    : "Tambah unit"}
              </Button>
            </div>
          </form>
      </ModalDialog>

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
