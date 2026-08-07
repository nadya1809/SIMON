"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  faPenToSquare,
  faPlus,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BooleanStatusField } from "@/components/forms/boolean-status-field";
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
import {
  LETTERS_ONLY_MESSAGE,
  SORT_ORDER_NUMERIC_ONLY_MESSAGE
} from "@/lib/input-rules";
import type { PaginatedData } from "@/lib/pagination";
import {
  type CriteriaFormInput,
  criteriaSchema,
  type CriteriaFormValues
} from "@/lib/validations/criteria";

const protectedDefaultCriteriaIds = new Set([
  "default-discipline-criteria",
  "default-performance-criteria"
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
  initialCriteria: PaginatedData<CriteriaItem>;
  userName: string;
  role: string;
};

export function CriteriaManagement({
  initialCriteria,
  role
}: CriteriaManagementProps) {
  const [sortBy, setSortBy] = useState<"name" | "sortOrder" | "status" | "scores">("sortOrder");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [criteria, setCriteria] = useState<CriteriaItem[]>(initialCriteria.data);
  const [page, setPage] = useState(initialCriteria.meta.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialCriteria.meta.rowsPerPage);
  const [totalItems, setTotalItems] = useState(initialCriteria.meta.totalItems);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<CriteriaItem | null>(
    null
  );
  const [pendingSubmitValues, setPendingSubmitValues] = useState<
    CriteriaFormValues | null
  >(null);
  const [confirmingCriteria, setConfirmingCriteria] =
    useState<CriteriaItem | null>(null);
  const [deletingCriteriaId, setDeletingCriteriaId] = useState<string | null>(
    null
  );
  const [isActiveValue, setIsActiveValue] = useState(true);
  const [isPending, startTransition] = useTransition();
  const hasMountedRef = useRef(false);

  const form = useForm<CriteriaFormInput, unknown, CriteriaFormValues>({
    resolver: zodResolver(criteriaSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      sortOrder: 0,
      isActive: true
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState,
    setValue,
    setError,
    trigger
  } = form;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  const loadCriteria = useCallback(async (nextPage = page, nextRowsPerPage = rowsPerPage) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      rowsPerPage: String(nextRowsPerPage),
      sortBy,
      sortDirection
    });
    const response = await fetch(`/api/criteria?${params.toString()}`);
    const result = (await response.json()) as {
      message?: string;
      data?: CriteriaItem[];
      meta?: PaginatedData<CriteriaItem>["meta"];
    };

    if (!response.ok || !result.data || !result.meta) {
      toast.error(getApiErrorMessage(result, "Gagal memuat daftar kriteria."));
      return;
    }

    setCriteria(result.data);
    setPage(result.meta.page);
    setRowsPerPage(result.meta.rowsPerPage);
    setTotalItems(result.meta.totalItems);
  }, [page, rowsPerPage, sortBy, sortDirection]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    void loadCriteria(page, rowsPerPage);
  }, [loadCriteria, page, rowsPerPage]);

  function toggleSort(nextSortBy: "name" | "sortOrder" | "status" | "scores") {
    if (sortBy === nextSortBy) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection("asc");
  }

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
    const duplicateSortOrder = criteria.find(
      (item) =>
        item.sortOrder === values.sortOrder && item.id !== editingCriteria?.id
    );

    if (duplicateSortOrder) {
      setIsFormDialogOpen(true);
      const duplicateMessage = `Urutan tampil ${values.sortOrder} sudah dipakai oleh "${duplicateSortOrder.name}".`;
      setError("sortOrder", {
        type: "manual",
        message: duplicateMessage
      });
      toast.error(duplicateMessage);
      return;
    }

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
        errors?: Record<string, string[] | undefined>;
      };

      if (!response.ok || !result.data) {
        applyServerFormErrors(setError, result.errors);
        setIsFormDialogOpen(true);
        toast.error(
          getApiErrorMessage(
            result,
            editingCriteria
              ? "Gagal memperbarui kriteria. Periksa kembali nama, urutan, dan status kriteria."
              : "Gagal menambahkan kriteria. Periksa kembali nama, urutan, dan status kriteria."
          )
        );
        return;
      }

      const nextCriteria = result.data;

      if (editingCriteria) {
        toast.success(
          result.message || `Kriteria "${nextCriteria.name}" berhasil diperbarui.`
        );
      } else {
        toast.success(
          result.message || `Kriteria "${nextCriteria.name}" berhasil ditambahkan.`
        );
      }

      await loadCriteria(editingCriteria ? page : 1, rowsPerPage);
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

      if (editingCriteria?.id === item.id) {
        resetForm();
      }

      const nextPage = criteria.length === 1 && page > 1 ? page - 1 : page;
      await loadCriteria(nextPage, rowsPerPage);

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
          <ModuleFilters>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Struktur penilaian aktif
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Pastikan urutan dan status kriteria sesuai kebutuhan operasional harian.
              </p>
            </div>
            <FilterActions>
            <Button
              icon={faPlus}
              onClick={() => {
                resetForm();
                setIsFormDialogOpen(true);
              }}
            >
              Tambah Kriteria
            </Button>
            </FilterActions>
          </ModuleFilters>

          <ModuleTableSection
            title="Daftar kriteria"
            description={`${criteria.length} kriteria terdaftar di sistem.`}
            headers={[
              {
                key: "name",
                label: "Nama Kriteria",
                sortable: true,
                sortDirection: sortBy === "name" ? sortDirection : null,
                onSort: () => toggleSort("name")
              },
              {
                key: "sortOrder",
                label: "Urutan",
                sortable: true,
                sortDirection: sortBy === "sortOrder" ? sortDirection : null,
                onSort: () => toggleSort("sortOrder")
              },
              {
                key: "status",
                label: "Status",
                sortable: true,
                sortDirection: sortBy === "status" ? sortDirection : null,
                onSort: () => toggleSort("status")
              },
              {
                key: "scores",
                label: "Histori Skor",
                sortable: true,
                sortDirection: sortBy === "scores" ? sortDirection : null,
                onSort: () => toggleSort("scores")
              },
              "Catatan",
              "Aksi"
            ]}
            isEmpty={!criteria.length}
            emptyState={
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
            }
          >
            {criteria.map((item) => {
              const isProtectedDefault =
                protectedDefaultCriteriaIds.has(item.id);

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
                    <div className="space-y-1">
                      <p>{item.description || "-"}</p>
                      {isProtectedDefault ? (
                        <p className="text-xs font-medium text-[var(--muted)]">
                          Kriteria default sistem, tidak bisa dihapus.
                        </p>
                      ) : null}
                    </div>
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
                            isProtectedDefault ||
                            deletingCriteriaId === item.id,
                          onClick: () => setConfirmingCriteria(item)
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
        onClose={resetForm}
        title={editingCriteria ? "Edit kriteria" : "Tambah kriteria baru"}
        description="Kriteria aktif akan dipakai di form penilaian harian. Nonaktifkan jika ingin menghentikan pemakaian tanpa merusak histori."
      >
          <FormDialogHeader isEditing={Boolean(editingCriteria)} onCancelEdit={resetForm} />

          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => {
              setIsFormDialogOpen(false);
              setPendingSubmitValues(values);
            })}
          >
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
                  maxLength={100}
                  autoCapitalize="sentences"
                  onInput={(event) => {
                    const sanitizedValue = event.currentTarget.value.replace(
                      /[^\p{L}\s.'-]+/gu,
                      ""
                    );

                    if (sanitizedValue !== event.currentTarget.value) {
                      event.currentTarget.value = sanitizedValue;
                      setError("name", {
                        type: "manual",
                        message: LETTERS_ONLY_MESSAGE
                      });
                      return;
                    }

                    void trigger("name");
                  }}
                  {...register("name")}
                />
              </FormField>

              <FormField
                label="Catatan"
                hint="Opsional. Gunakan untuk menjelaskan cakupan penilaian."
                error={formState.errors.description?.message}
              >
                <Textarea
                  placeholder="Tulis catatan singkat"
                  maxLength={255}
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
                  max={999}
                  step={1}
                  inputMode="numeric"
                  onInput={(event) => {
                    const sanitizedValue = event.currentTarget.value.replace(
                      /\D+/g,
                      ""
                    );

                    if (sanitizedValue !== event.currentTarget.value) {
                      event.currentTarget.value = sanitizedValue;
                      setError("sortOrder", {
                        type: "manual",
                        message: SORT_ORDER_NUMERIC_ONLY_MESSAGE
                      });
                      return;
                    }

                    if (sanitizedValue && Number(sanitizedValue) > 999) {
                      event.currentTarget.value = "999";
                    }

                    void trigger("sortOrder");
                  }}
                  onKeyDown={(event) => {
                    if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
                      event.preventDefault();
                    }
                  }}
                  placeholder="0"
                  {...register("sortOrder")}
                />
              </FormField>
            </FormSection>

            <FormSection
              title="Status kriteria"
              description="Kriteria nonaktif tidak dipakai lagi di form baru, tetapi histori lama tetap aman."
            >
              <BooleanStatusField
                label="Status kriteria"
                value={isActiveValue}
                onToggle={() => {
                  const nextValue = !isActiveValue;
                  setIsActiveValue(nextValue);
                  setValue("isActive", nextValue);
                }}
                enabledText="Kriteria aktif dan dipakai di form assessment"
                disabledText="Kriteria nonaktif, histori lama tetap tersimpan"
              />
            </FormSection>

            <FormDialogActions
              isPending={isPending}
              isEditing={Boolean(editingCriteria)}
              createLabel="Tambah kriteria"
              onCancel={resetForm}
            />
          </form>
      </ModalDialog>

      <ConfirmDialog
        open={Boolean(pendingSubmitValues)}
        title={
          editingCriteria ? "Simpan perubahan kriteria?" : "Tambah kriteria baru?"
        }
        description={
          editingCriteria
            ? "Perubahan kriteria akan memengaruhi form penilaian berikutnya."
            : "Kriteria baru akan langsung tersedia di assessment baru."
        }
        variant="primary"
        icon={editingCriteria ? faPenToSquare : faPlus}
        confirmLabel={editingCriteria ? "Ya, simpan" : "Ya, tambah"}
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
        open={Boolean(confirmingCriteria)}
        title={
          confirmingCriteria
            ? `Hapus kriteria ${confirmingCriteria.name}?`
            : "Hapus kriteria?"
        }
        description="Kriteria hanya bisa dihapus jika bukan kriteria default sistem dan belum memiliki histori skor."
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
