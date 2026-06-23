"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormField } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SuccessFeedback } from "@/components/ui/success-feedback";
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
  userName,
  role
}: UnitManagementProps) {
  const [units, setUnits] = useState<UnitItem[]>(initialUnits);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [requestError, setRequestError] = useState<string>("");
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
    setEditingUnit(null);
    setRequestError("");
    setFeedback("");
    reset({ name: "", description: "" });
  }

  function startEditMode(unit: UnitItem) {
    setEditingUnit(unit);
    setRequestError("");
    setFeedback("");
    reset({
      name: unit.name,
      description: unit.description ?? ""
    });
  }

  async function onSubmit(values: UnitFormValues) {
    setRequestError("");
    setFeedback("");

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
        setRequestError(result.message || "Gagal menyimpan unit.");
        return;
      }

      const nextUnit = result.data;

      if (editingUnit) {
        setUnits((current) =>
          current
            .map((item) => (item.id === nextUnit.id ? nextUnit : item))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setFeedback("Data unit berhasil diperbarui.");
      } else {
        setUnits((current) =>
          [...current, nextUnit].sort((a, b) => a.name.localeCompare(b.name))
        );
        setFeedback("Unit baru berhasil ditambahkan.");
      }

      setEditingUnit(null);
      reset({ name: "", description: "" });
    });
  }

  return (
    <DashboardShell
      title="Master Data Unit"
      description="Kelola unit kerja yang akan dipakai untuk pengelompokan petugas PST dan analisis dashboard per unit."
      userName={userName}
      role={role}
    >
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Table headers={["Nama Unit", "Jumlah Petugas", "Deskripsi", "Aksi"]}>
          {units.length ? (
            units.map((unit) => (
              <tr key={unit.id} className="border-t border-[var(--border)]">
                <td className="px-5 py-4 font-semibold">{unit.name}</td>
                <td className="px-5 py-4">
                  <Badge variant="default">{unit._count.officers} petugas</Badge>
                </td>
                <td className="px-5 py-4 text-[var(--muted)]">
                  {unit.description || "-"}
                </td>
                <td className="px-5 py-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEditMode(unit)}
                  >
                    Edit
                  </Button>
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
                />
              </td>
            </tr>
          )}
        </Table>

        <Dialog
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

          {feedback ? (
            <div className="mb-4">
              <SuccessFeedback title={feedback} />
            </div>
          ) : null}

          {requestError ? (
            <div className="mb-4 rounded-2xl border border-[#f4c7c3] bg-[#fff5f4] px-4 py-3 text-sm text-[#8f261c]">
              {requestError}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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

            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending
                ? "Menyimpan..."
                : editingUnit
                  ? "Simpan perubahan"
                  : "Tambah unit"}
            </Button>
          </form>
        </Dialog>
      </section>
    </DashboardShell>
  );
}
