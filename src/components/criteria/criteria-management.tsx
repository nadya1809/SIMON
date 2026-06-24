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
import {
  type CriteriaFormInput,
  criteriaSchema,
  type CriteriaFormValues
} from "@/lib/validations/criteria";

const defaultSeedIds = new Set([
  "seed-discipline-criteria",
  "seed-performance-criteria"
]);

type CriteriaItem = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: {
    scores: number;
  };
};

type CriteriaManagementProps = {
  initialCriteria: CriteriaItem[];
  userName: string;
  role: string;
};

export function CriteriaManagement({
  initialCriteria,
  role
}: CriteriaManagementProps) {
  const [criteria, setCriteria] = useState<CriteriaItem[]>(initialCriteria);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<CriteriaItem | null>(
    null
  );
  const [confirmingCriteria, setConfirmingCriteria] =
    useState<CriteriaItem | null>(null);
  const [deletingCriteriaId, setDeletingCriteriaId] = useState<string | null>(
    null
  );
  const [isActiveValue, setIsActiveValue] = useState(true);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CriteriaFormInput, unknown, CriteriaFormValues>({
    resolver: zodResolver(criteriaSchema),
    defaultValues: {
      name: "",
      description: "",
      sortOrder: 0,
      isActive: true
    }
  });

  const { register, handleSubmit, reset, formState, setValue } = form;

  function resetForm() {
    setIsFormDialogOpen(false);
    setEditingCriteria(null);
    setIsActiveValue(true);
    reset({
      name: "",
      description: "",
      sortOrder: 0,
      isActive: true
    });
  }

  function startEditMode(item: CriteriaItem) {
    setIsFormDialogOpen(true);
    setEditingCriteria(item);
    setIsActiveValue(item.isActive);
    reset({
      name: item.name,
      description: item.description ?? "",
      sortOrder: item.sortOrder,
      isActive: item.isActive
    });
  }

  async function onSubmit(values: CriteriaFormValues) {
    const endpoint = editingCriteria
      ? `/api/criteria/${editingCriteria.id}`
      : "/api/criteria";
    const method = editingCriteria ? "PATCH" : "POST";

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
        data?: CriteriaItem;
      };

      if (!response.ok || !result.data) {
        toast.error(result.message || "Gagal menyimpan kriteria.");
        return;
      }

      const nextCriteria = result.data;

      if (editingCriteria) {
        setCriteria((current) =>
          current
            .map((item) => (item.id === nextCriteria.id ? nextCriteria : item))
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        );
        toast.success("Kriteria berhasil diperbarui.");
      } else {
        setCriteria((current) =>
          [...current, nextCriteria].sort(
            (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
          )
        );
        toast.success("Kriteria baru berhasil ditambahkan.");
      }

      resetForm();
    });
  }

  async function deleteCriteria(item: CriteriaItem) {
    setDeletingCriteriaId(item.id);

    try {
      const response = await fetch(`/api/criteria/${item.id}`, {
        method: "DELETE"
      });

      const result = (await response.json()) as {
        message: string;
      };

      if (!response.ok) {
        toast.error(result.message || "Gagal menghapus kriteria.");
        return;
      }

      setCriteria((current) => current.filter((entry) => entry.id !== item.id));

      if (editingCriteria?.id === item.id) {
        resetForm();
      }

      toast.success(result.message || "Kriteria berhasil dihapus.");
    } finally {
      setDeletingCriteriaId(null);
    }
  }

  return (
    <DashboardShell
      title="Master Data Kriteria"
      description="Kelola kriteria penilaian yang aktif dipakai sistem. Histori skor lama akan tetap aman meskipun suatu kriteria dinonaktifkan."
      role={role}
    >
      <section className="space-y-5">
          <FilterToolbar>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Struktur penilaian aktif
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Pastikan urutan dan status kriteria sesuai kebutuhan operasional harian.
              </p>
            </div>
            <Button
              icon={faPlus}
              onClick={() => {
                resetForm();
                setIsFormDialogOpen(true);
              }}
            >
              Tambah Kriteria
            </Button>
          </FilterToolbar>

          <DataTableShell
            title="Daftar kriteria"
            description={`${criteria.length} kriteria terdaftar di sistem.`}
          >
            <Table
              headers={[
                "Nama Kriteria",
                "Urutan",
                "Status",
                "Histori Skor",
                "Catatan",
                "Aksi"
              ]}
            >
              {criteria.length ? (
                criteria.map((item) => {
                  const isSeedDefault = defaultSeedIds.has(item.id);

                  return (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="px-5 py-4 font-semibold">{item.name}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {item.sortOrder}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={item.isActive ? "success" : "warning"}>
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {item._count.scores} skor
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {isSeedDefault
                          ? "Kriteria default seed, jangan dihapus."
                          : item.description || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <ActionMenu
                          items={[
                            {
                              label: "Edit kriteria",
                              icon: faPenToSquare,
                              onClick: () => startEditMode(item)
                            },
                            {
                              label:
                                deletingCriteriaId === item.id
                                  ? "Menghapus..."
                                  : "Hapus kriteria",
                              icon: faTrash,
                              variant: "danger",
                              disabled:
                                isSeedDefault || deletingCriteriaId === item.id,
                              onClick: () => setConfirmingCriteria(item)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8">
                    <EmptyState
                      title="Belum ada kriteria"
                      description="Tambahkan kriteria penilaian agar form assessment bisa memakai struktur yang kamu tentukan."
                      icon="K"
                      actionLabel="Tambah Kriteria"
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
      </section>

      <ModalDialog
        open={isFormDialogOpen}
        onClose={resetForm}
        title={editingCriteria ? "Edit kriteria" : "Tambah kriteria baru"}
        description="Kriteria aktif akan dipakai di form penilaian harian. Nonaktifkan jika ingin menghentikan pemakaian tanpa merusak histori."
      >
          <div className="mb-4 flex items-center justify-between">
            <Badge variant={editingCriteria ? "warning" : "success"}>
              {editingCriteria ? "Mode edit" : "Mode tambah"}
            </Badge>
            {editingCriteria ? (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Batal edit
              </Button>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormSection
              title="Informasi kriteria"
              description="Lengkapi nama, deskripsi, dan urutan tampil agar form penilaian lebih terstruktur."
            >
              <FormField
                label="Nama kriteria"
                error={formState.errors.name?.message}
              >
                <Input
                  placeholder="Masukkan nama kriteria"
                  {...register("name")}
                />
              </FormField>

              <FormField
                label="Deskripsi"
                hint="Opsional. Gunakan untuk menjelaskan cakupan penilaian."
                error={formState.errors.description?.message}
              >
                <Textarea
                  placeholder="Tulis deskripsi singkat"
                  {...register("description")}
                />
              </FormField>

              <FormField
                label="Urutan tampil"
                hint="Semakin kecil angkanya, semakin atas posisinya di form."
                error={formState.errors.sortOrder?.message}
              >
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  {...register("sortOrder")}
                />
              </FormField>
            </FormSection>

            <FormSection
              title="Status kriteria"
              description="Kriteria nonaktif tidak dipakai lagi di form baru, tetapi histori lama tetap aman."
            >
              <FormField label="Status kriteria">
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
                      ? "Kriteria aktif dan dipakai di form assessment"
                      : "Kriteria nonaktif, histori lama tetap tersimpan"}
                  </span>
                  <Badge variant={isActiveValue ? "success" : "warning"}>
                    {isActiveValue ? "Aktif" : "Nonaktif"}
                  </Badge>
                </button>
              </FormField>
            </FormSection>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Menyimpan..."
                  : editingCriteria
                    ? "Simpan perubahan"
                    : "Tambah kriteria"}
              </Button>
            </div>
          </form>
      </ModalDialog>

      <ConfirmDialog
        open={Boolean(confirmingCriteria)}
        title={
          confirmingCriteria
            ? `Hapus kriteria ${confirmingCriteria.name}?`
            : "Hapus kriteria?"
        }
        description="Kriteria hanya bisa dihapus jika bukan data seed dan belum memiliki histori skor."
        isLoading={
          Boolean(confirmingCriteria) &&
          deletingCriteriaId === confirmingCriteria?.id
        }
        onClose={() => {
          if (!deletingCriteriaId) {
            setConfirmingCriteria(null);
          }
        }}
        onConfirm={() => {
          if (confirmingCriteria) {
            void deleteCriteria(confirmingCriteria).finally(() =>
              setConfirmingCriteria(null)
            );
          }
        }}
      />
    </DashboardShell>
  );
}
