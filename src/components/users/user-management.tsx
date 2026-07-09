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
import { Select } from "@/components/ui/select";
import { applyServerFormErrors, getApiErrorMessage } from "@/lib/form-api";
import type { PaginatedData } from "@/lib/pagination";
import {
  userSchema,
  userUpdateSchema,
  type UserFormInput,
  type UserFormValues,
  type UserUpdateFormInput,
  type UserUpdateFormValues
} from "@/lib/validations/user";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPERVISOR" | "PIMPINAN";
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type UserManagementProps = {
  initialUsers: PaginatedData<UserItem>;
  currentUserId: string;
  userName: string;
  role: string;
};

export function UserManagement({
  initialUsers,
  currentUserId,
  role
}: UserManagementProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers.data);
  const [page, setPage] = useState(initialUsers.meta.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialUsers.meta.rowsPerPage);
  const [totalItems, setTotalItems] = useState(initialUsers.meta.totalItems);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState<{
    mode: "create" | "update";
    values: UserFormValues | UserUpdateFormValues;
  } | null>(null);
  const [confirmingUser, setConfirmingUser] = useState<UserItem | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isActiveValue, setIsActiveValue] = useState(true);
  const [isPending, startTransition] = useTransition();
  const hasMountedRef = useRef(false);

  const createForm = useForm<UserFormInput, unknown, UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "SUPERVISOR",
      password: "",
      isActive: true
    }
  });

  const updateForm = useForm<UserUpdateFormInput, unknown, UserUpdateFormValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "SUPERVISOR",
      password: "",
      isActive: true
    }
  });

  const activeForm = editingUser ? updateForm : createForm;
  const { register, handleSubmit, reset, formState, setValue } = activeForm;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  const loadUsers = useCallback(async (nextPage = page, nextRowsPerPage = rowsPerPage) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      rowsPerPage: String(nextRowsPerPage)
    });
    const response = await fetch(`/api/users?${params.toString()}`);
    const result = (await response.json()) as {
      message?: string;
      data?: UserItem[];
      meta?: PaginatedData<UserItem>["meta"];
    };

    if (!response.ok || !result.data || !result.meta) {
      toast.error(getApiErrorMessage(result, "Gagal memuat daftar user."));
      return;
    }

    setUsers(result.data);
    setPage(result.meta.page);
    setRowsPerPage(result.meta.rowsPerPage);
    setTotalItems(result.meta.totalItems);
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    void loadUsers(page, rowsPerPage);
  }, [loadUsers, page, rowsPerPage]);

  function resetCreateMode() {
    setIsFormDialogOpen(false);
    setEditingUser(null);
    setIsActiveValue(true);
    createForm.reset({
      name: "",
      email: "",
      role: "SUPERVISOR",
      password: "",
      isActive: true
    });
    updateForm.reset({
      name: "",
      email: "",
      role: "SUPERVISOR",
      password: "",
      isActive: true
    });
  }

  function startEditMode(user: UserItem) {
    setIsFormDialogOpen(true);
    setEditingUser(user);
    setIsActiveValue(user.isActive);
    updateForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      isActive: user.isActive
    });
  }

  async function submitCreate(values: UserFormValues) {
    startTransition(async () => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const result = (await response.json()) as {
        message: string;
        data?: UserItem;
        errors?: Record<string, string[] | undefined>;
      };

      if (!response.ok || !result.data) {
        applyServerFormErrors(createForm.setError, result.errors);
        toast.error(
          getApiErrorMessage(
            result,
            "Gagal menambahkan user. Periksa kembali nama, email, role, dan password."
          )
        );
        return;
      }

      await loadUsers(1, rowsPerPage);
      toast.success(
        result.message || `User "${result.data.name}" berhasil ditambahkan.`
      );
      resetCreateMode();
    });
  }

  async function submitUpdate(values: UserUpdateFormValues) {
    if (!editingUser) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const result = (await response.json()) as {
        message: string;
        data?: UserItem;
        errors?: Record<string, string[] | undefined>;
      };

      if (!response.ok || !result.data) {
        applyServerFormErrors(updateForm.setError, result.errors);
        toast.error(
          getApiErrorMessage(
            result,
            "Gagal memperbarui user. Periksa kembali data akun yang diubah."
          )
        );
        return;
      }

      await loadUsers();
      toast.success(
        result.message || `User "${result.data.name}" berhasil diperbarui.`
      );
      resetCreateMode();
    });
  }

  async function deleteUser(user: UserItem) {
    setDeletingUserId(user.id);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE"
      });

      const result = (await response.json()) as {
        message: string;
      };

      if (!response.ok) {
        toast.error(result.message || "Gagal menghapus user.");
        return;
      }

      if (editingUser?.id === user.id) {
        resetCreateMode();
      }

      const nextPage = users.length === 1 && page > 1 ? page - 1 : page;
      await loadUsers(nextPage, rowsPerPage);

      toast.success(result.message || "User berhasil dihapus.");
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <DashboardShell
      title="Manajemen User"
      description="Kelola akun Admin, Supervisor, dan Pimpinan. Semua akun dibuat manual oleh Admin sesuai keputusan PRD."
      role={role}
    >
      <section className="space-y-5">
          <ModuleFilters>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Akses pengguna sistem
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Kelola hak akses pengguna internal dengan struktur role yang jelas dan aman.
              </p>
            </div>
            <FilterActions>
            <Button
              icon={faPlus}
              onClick={() => {
                resetCreateMode();
                setIsFormDialogOpen(true);
              }}
            >
              Tambah User
            </Button>
            </FilterActions>
          </ModuleFilters>

          <ModuleTableSection
            title="Daftar akun"
            description={`${users.length} user aktif dan nonaktif terdaftar.`}
            headers={["Nama", "Email", "Role", "Status", "Aksi"]}
            isEmpty={!users.length}
            emptyState={
              <EmptyState
                title="Belum ada user tambahan"
                description="Tambahkan akun Supervisor atau Pimpinan agar tim bisa mulai menggunakan sistem."
                icon="U"
                actionLabel="Tambah User"
                onAction={() => {
                  resetCreateMode();
                  setIsFormDialogOpen(true);
                }}
              />
            }
          >
            {users.map((user) => (
              <tr key={user.id} className="border-t border-[var(--border)]">
                <td className="px-5 py-4 font-semibold">{user.name}</td>
                <td className="px-5 py-4 text-[var(--muted)]">{user.email}</td>
                <td className="px-5 py-4">
                  <Badge variant="default">{user.role}</Badge>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={user.isActive ? "success" : "warning"}>
                    {user.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <ActionMenu
                    items={[
                      {
                        label: "Edit user",
                        icon: faPenToSquare,
                        onClick: () => startEditMode(user)
                      },
                      {
                        label:
                          deletingUserId === user.id
                            ? "Menghapus..."
                            : "Hapus user",
                        icon: faTrash,
                        variant: "danger",
                        disabled:
                          user.id === currentUserId ||
                          deletingUserId === user.id,
                        onClick: () => setConfirmingUser(user)
                      }
                    ]}
                  />
                </td>
              </tr>
            ))}
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
        onClose={resetCreateMode}
        title={editingUser ? "Edit user" : "Tambah user baru"}
        description="Email harus unik. Password bisa diisi ulang saat edit jika ingin melakukan reset."
        className="max-w-4xl"
      >
          <FormDialogHeader isEditing={Boolean(editingUser)} onCancelEdit={resetCreateMode} />

          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              if (editingUser) {
                setPendingSubmit({
                  mode: "update",
                  values: values as UserUpdateFormValues
                });
                return;
              }

              setPendingSubmit({
                mode: "create",
                values: values as UserFormValues
              });
            })}
          >
            <FormSection
              title="Informasi akun"
              description="Isi data identitas dasar dan tentukan role yang sesuai untuk penggunaan internal."
            >
              <FormField label="Nama" error={formState.errors.name?.message}>
                <Input placeholder="Masukkan nama user" {...register("name")} />
              </FormField>

              <FormField label="Email" error={formState.errors.email?.message}>
                <Input placeholder="Masukkan email user" {...register("email")} />
              </FormField>

              <FormField label="Role" error={formState.errors.role?.message}>
                <Select {...register("role")}>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="PIMPINAN">Pimpinan</option>
                </Select>
              </FormField>
            </FormSection>

            <FormSection
              title="Keamanan akun"
              description="Password dapat direset saat edit jika diperlukan tanpa mengubah field lain."
            >
              <FormField
                label={editingUser ? "Reset password" : "Password"}
                hint={
                  editingUser
                    ? "Kosongkan jika tidak ingin mengubah password."
                    : "Minimal 8 karakter."
                }
                error={formState.errors.password?.message}
              >
                <Input
                  type="password"
                  placeholder={
                    editingUser ? "Opsional saat edit" : "Masukkan password"
                  }
                  {...register("password")}
                />
              </FormField>

              <BooleanStatusField
                label="Status akun"
                value={isActiveValue}
                onToggle={() => {
                  const nextValue = !isActiveValue;
                  setIsActiveValue(nextValue);
                  setValue("isActive", nextValue);
                }}
                disabled={editingUser?.id === currentUserId}
                enabledText="Akun aktif dan bisa login"
                disabledText="Akun nonaktif dan tidak bisa login"
              />
            </FormSection>

            <FormDialogActions
              isPending={isPending}
              isEditing={Boolean(editingUser)}
              createLabel="Tambah user"
              onCancel={resetCreateMode}
            />
          </form>
      </ModalDialog>

      <ConfirmDialog
        open={Boolean(pendingSubmit)}
        title={
          pendingSubmit?.mode === "update"
            ? "Simpan perubahan user?"
            : "Tambah user baru?"
        }
        description={
          pendingSubmit?.mode === "update"
            ? "Perubahan akun akan langsung diterapkan."
            : "Akun baru akan langsung tersedia sesuai role yang dipilih."
        }
        variant="primary"
        icon={pendingSubmit?.mode === "update" ? faPenToSquare : faPlus}
        confirmLabel={
          pendingSubmit?.mode === "update" ? "Ya, simpan" : "Ya, tambah"
        }
        isLoading={isPending}
        onClose={() => {
          if (!isPending) {
            setPendingSubmit(null);
          }
        }}
        onConfirm={() => {
          if (!pendingSubmit) {
            return;
          }

          if (pendingSubmit.mode === "update") {
            void submitUpdate(pendingSubmit.values as UserUpdateFormValues);
          } else {
            void submitCreate(pendingSubmit.values as UserFormValues);
          }

          setPendingSubmit(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmingUser)}
        title={
          confirmingUser
            ? `Hapus user ${confirmingUser.name}?`
            : "Hapus user?"
        }
        description="User hanya bisa dihapus jika bukan akun aktif yang sedang dipakai dan belum memiliki histori aktivitas sistem."
        isLoading={
          Boolean(confirmingUser) && deletingUserId === confirmingUser?.id
        }
        onClose={() => {
          if (!deletingUserId) {
            setConfirmingUser(null);
          }
        }}
        onConfirm={() => {
          if (confirmingUser) {
            void deleteUser(confirmingUser).finally(() =>
              setConfirmingUser(null)
            );
          }
        }}
      />
    </DashboardShell>
  );
}
