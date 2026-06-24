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
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
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
  initialUsers: UserItem[];
  currentUserId: string;
  userName: string;
  role: string;
};

export function UserManagement({
  initialUsers,
  currentUserId,
  role
}: UserManagementProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [confirmingUser, setConfirmingUser] = useState<UserItem | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isActiveValue, setIsActiveValue] = useState(true);
  const [isPending, startTransition] = useTransition();

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

  function resetCreateMode() {
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
      };

      if (!response.ok || !result.data) {
        toast.error(result.message || "Gagal menambahkan user.");
        return;
      }

      setUsers((current) => [result.data!, ...current]);
      toast.success("User baru berhasil ditambahkan.");
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
      };

      if (!response.ok || !result.data) {
        toast.error(result.message || "Gagal memperbarui user.");
        return;
      }

      setUsers((current) =>
        current.map((item) => (item.id === result.data!.id ? result.data! : item))
      );
      toast.success("Data user berhasil diperbarui.");
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

      setUsers((current) => current.filter((item) => item.id !== user.id));

      if (editingUser?.id === user.id) {
        resetCreateMode();
      }

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
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <FilterToolbar>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Akses pengguna sistem
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Kelola hak akses pengguna internal dengan struktur role yang jelas dan aman.
              </p>
            </div>
            <Button icon={faPlus} onClick={resetCreateMode}>
              Tambah User
            </Button>
          </FilterToolbar>

          <DataTableShell
            title="Daftar akun"
            description={`${users.length} user aktif dan nonaktif terdaftar.`}
          >
            <Table headers={["Nama", "Email", "Role", "Status", "Aksi"]}>
              {users.length ? (
                users.map((user) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8">
                    <EmptyState
                      title="Belum ada user tambahan"
                      description="Tambahkan akun Supervisor atau Pimpinan agar tim bisa mulai menggunakan sistem."
                      icon="U"
                      actionLabel="Tambah User"
                      onAction={resetCreateMode}
                    />
                  </td>
                </tr>
              )}
            </Table>
          </DataTableShell>
        </div>

        <Dialog
          title={editingUser ? "Edit user" : "Tambah user baru"}
          description="Email harus unik. Password bisa diisi ulang saat edit jika ingin melakukan reset."
        >
          <div className="mb-4 flex items-center justify-between">
            <Badge variant={editingUser ? "warning" : "success"}>
              {editingUser ? "Mode edit" : "Mode tambah"}
            </Badge>
            {editingUser ? (
              <Button variant="ghost" size="sm" onClick={resetCreateMode}>
                Batal edit
              </Button>
            ) : null}
          </div>

          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              if (editingUser) {
                await submitUpdate(values as UserUpdateFormValues);
                return;
              }

              await submitCreate(values as UserFormValues);
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

              <FormField label="Status akun">
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = !isActiveValue;
                    setIsActiveValue(nextValue);
                    setValue("isActive", nextValue);
                  }}
                  disabled={editingUser?.id === currentUserId}
                  className="flex w-full items-center justify-between rounded-[var(--radius-control)] border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-[var(--shadow-sm)] disabled:opacity-60"
                >
                  <span>
                    {isActiveValue
                      ? "Akun aktif dan bisa login"
                      : "Akun nonaktif dan tidak bisa login"}
                  </span>
                  <Badge variant={isActiveValue ? "success" : "warning"}>
                    {isActiveValue ? "Aktif" : "Nonaktif"}
                  </Badge>
                </button>
              </FormField>
            </FormSection>

            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending
                ? "Menyimpan..."
                : editingUser
                  ? "Simpan perubahan"
                  : "Tambah user"}
            </Button>
          </form>
        </Dialog>
      </section>

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
