"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import {
  faPenToSquare,
  faPlus,
  faRotateLeft,
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
import { DataTableShell } from "@/components/ui/data-table-shell";
import { DateInput } from "@/components/ui/date-input";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { showConfirmToast } from "@/lib/confirm-toast";
import { formatAverageScore } from "@/lib/scoring";
import {
  assessmentSchema,
  type AssessmentFormInput,
  type AssessmentFormValues
} from "@/lib/validations/assessment";

type OfficerOption = {
  id: string;
  name: string;
  nip: string;
  unitId: string | null;
  unit: { id: string; name: string } | null;
};

type CriteriaOption = {
  id: string;
  name: string;
  sortOrder: number;
};

type AssessmentItem = {
  id: string;
  officerId: string;
  assessmentDate: string | Date;
  status: "PRESENT" | "ABSENT";
  averageScore: number | null;
  notes: string | null;
  officer: {
    id: string;
    name: string;
    nip: string;
    unit: { id: string; name: string } | null;
  };
  assessor: {
    id: string;
    name: string | null;
    email: string | null;
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

type AssessmentManagementProps = {
  initialAssessments: AssessmentItem[];
  officers: OfficerOption[];
  criteria: CriteriaOption[];
  userName: string;
  role: string;
};

type StatusFilter = "all" | "PRESENT" | "ABSENT";

type AssessmentScoreInput = {
  criteriaId: string;
  score: number;
};

function toDateInputValue(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDefaultScores(criteria: CriteriaOption[]) {
  return criteria.map((item) => ({
    criteriaId: item.id,
    score: 1
  }));
}

export function AssessmentManagement({
  initialAssessments,
  officers,
  criteria,
  role
}: AssessmentManagementProps) {
  const [assessments, setAssessments] = useState(initialAssessments);
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentItem | null>(null);
  const [statusValue, setStatusValue] = useState<"PRESENT" | "ABSENT">(
    "PRESENT"
  );
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(
    null
  );
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [searchOfficer, setSearchOfficer] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [visibleRows, setVisibleRows] = useState(10);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(searchOfficer);

  const units = useMemo(() => {
    const unitMap = new Map<string, { id: string; name: string }>();

    officers.forEach((officer) => {
      if (officer.unit) {
        unitMap.set(officer.unit.id, officer.unit);
      }
    });

    return [...unitMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [officers]);

  const form = useForm<AssessmentFormInput, unknown, AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      officerId: "",
      assessmentDate: toDateInputValue(new Date()),
      status: "PRESENT",
      notes: "",
      scores: createDefaultScores(criteria)
    }
  });

  const { register, handleSubmit, reset, formState, setValue } = form;

  function resetForm() {
    setEditingAssessment(null);
    setStatusValue("PRESENT");
    setSelectedOfficerId("");
    reset({
      officerId: "",
      assessmentDate: toDateInputValue(new Date()),
      status: "PRESENT",
      notes: "",
      scores: createDefaultScores(criteria)
    });
  }

  function startEditMode(assessment: AssessmentItem) {
    setEditingAssessment(assessment);
    setStatusValue(assessment.status);
    setSelectedOfficerId(assessment.officerId);
    reset({
      officerId: assessment.officerId,
      assessmentDate: toDateInputValue(assessment.assessmentDate),
      status: assessment.status,
      notes: assessment.notes ?? "",
      scores: criteria.map((item) => ({
        criteriaId: item.id,
        score:
          assessment.scores.find((score) => score.criteria.id === item.id)
            ?.score ?? 1
      }))
    });
  }

  const filteredAssessments = assessments
    .filter((item) => {
      const normalizedSearch = deferredSearch.trim().toLowerCase();

      if (
        normalizedSearch &&
        !`${item.officer.name} ${item.officer.nip}`
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (unitFilter !== "all" && item.officer.unit?.id !== unitFilter) {
        return false;
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      const dateValue = toDateInputValue(item.assessmentDate);

      if (fromDate && dateValue < fromDate) {
        return false;
      }

      if (toDate && dateValue > toDate) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dateComparison =
        new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime();

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return a.officer.name.localeCompare(b.officer.name);
    });

  const displayedAssessments = filteredAssessments.slice(0, visibleRows);

  async function onSubmit(values: AssessmentFormValues) {
    const payload = {
      ...values,
      notes: values.notes?.trim() || "",
      scores:
        values.status === "ABSENT"
          ? []
          : values.scores.map((item) => ({
              criteriaId: item.criteriaId,
              score: Number(item.score)
            }))
    };

    const endpoint = editingAssessment
      ? `/api/assessments/${editingAssessment.id}`
      : "/api/assessments";
    const method = editingAssessment ? "PATCH" : "POST";

    startTransition(async () => {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as {
        message: string;
        data?: AssessmentItem;
      };

      if (!response.ok || !result.data) {
        toast.error(result.message || "Gagal menyimpan penilaian.");
        return;
      }

      const nextAssessment = result.data;

      if (editingAssessment) {
        setAssessments((current) =>
          current.map((item) =>
            item.id === nextAssessment.id ? nextAssessment : item
          )
        );
        toast.success("Penilaian berhasil diperbarui.");
      } else {
        setAssessments((current) => [nextAssessment, ...current]);
        toast.success("Penilaian harian berhasil ditambahkan.");
      }

      resetForm();
    });
  }

  async function deleteAssessment(assessment: AssessmentItem) {
    setDeletingAssessmentId(assessment.id);

    try {
      const response = await fetch(`/api/assessments/${assessment.id}`, {
        method: "DELETE"
      });

      const result = (await response.json()) as {
        message: string;
      };

      if (!response.ok) {
        toast.error(result.message || "Gagal menghapus penilaian.");
        return;
      }

      setAssessments((current) => current.filter((item) => item.id !== assessment.id));

      if (editingAssessment?.id === assessment.id) {
        resetForm();
      }

      toast.success(result.message || "Penilaian berhasil dihapus.");
    } finally {
      setDeletingAssessmentId(null);
    }
  }

  const activeOfficer = officers.find((item) => item.id === selectedOfficerId);

  return (
    <DashboardShell
      title="Penilaian Harian"
      description="Input dan pantau penilaian harian petugas PST. Status tidak hadir tetap harus dicatat agar kepatuhan pengisian harian tetap akurat."
      role={role}
    >
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <FilterToolbar>
            <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <FormField label="Cari petugas">
                <Input
                  value={searchOfficer}
                  onChange={(event) => {
                    setSearchOfficer(event.target.value);
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

              <FormField label="Status hadir">
                <Select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as StatusFilter);
                    setVisibleRows(10);
                  }}
                >
                  <option value="all">Semua status</option>
                  <option value="PRESENT">Hadir</option>
                  <option value="ABSENT">Tidak Hadir</option>
                </Select>
              </FormField>

              <FormField label="Dari tanggal">
                <DateInput
                  value={fromDate}
                  onChange={(event) => {
                    setFromDate(event.target.value);
                    setVisibleRows(10);
                  }}
                />
              </FormField>

              <FormField label="Sampai tanggal">
                <DateInput
                  value={toDate}
                  onChange={(event) => {
                    setToDate(event.target.value);
                    setVisibleRows(10);
                  }}
                />
              </FormField>
            </div>

            <div className="flex items-end gap-3">
              <Button icon={faPlus} onClick={resetForm}>
                Input Penilaian
              </Button>
              <Button
                variant="secondary"
                icon={faRotateLeft}
                onClick={() => {
                  setSearchOfficer("");
                  setUnitFilter("all");
                  setStatusFilter("all");
                  setFromDate("");
                  setToDate("");
                  setVisibleRows(10);
                }}
              >
                Reset Filter
              </Button>
            </div>
          </FilterToolbar>

          <DataTableShell
            title="Riwayat penilaian"
            description={`${filteredAssessments.length} data sesuai filter aktif.`}
          >
            <Table
              headers={[
                "Tanggal",
                "Petugas",
                "Unit",
                "Status",
                "Skor",
                "Rata-rata",
                "Aksi"
              ]}
            >
              {displayedAssessments.length ? (
                displayedAssessments.map((item) => (
                  <tr key={item.id} className="border-t border-[var(--border)]">
                    <td className="px-5 py-4 font-medium">
                      {toDateInputValue(item.assessmentDate)}
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold">{item.officer.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          NIP: {item.officer.nip}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)]">
                      {item.officer.unit?.name ?? "-"}
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
                    <td className="px-5 py-4">
                      <ActionMenu
                        items={[
                          {
                            label: "Edit penilaian",
                            icon: faPenToSquare,
                            onClick: () => startEditMode(item)
                          },
                          {
                            label:
                              deletingAssessmentId === item.id
                                ? "Menghapus..."
                                : "Hapus penilaian",
                            icon: faTrash,
                            variant: "danger",
                            disabled: deletingAssessmentId === item.id,
                            onClick: () =>
                              showConfirmToast({
                                title: `Hapus penilaian ${item.officer.name}?`,
                                description:
                                  "Data penilaian harian yang dihapus tidak bisa dipulihkan lagi.",
                                confirmLabel: "Ya, hapus",
                                cancelLabel: "Batal",
                                onConfirm: () => deleteAssessment(item)
                              })
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8">
                    <EmptyState
                      title="Belum ada data penilaian yang cocok"
                      description="Tambahkan penilaian baru atau ubah filter untuk melihat data pada tanggal dan petugas lain."
                      icon="A"
                      actionLabel="Input Penilaian"
                      onAction={resetForm}
                    />
                  </td>
                </tr>
              )}
            </Table>
          </DataTableShell>

          {filteredAssessments.length > displayedAssessments.length ? (
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
          title={editingAssessment ? "Edit penilaian" : "Input penilaian baru"}
          description="Satu petugas hanya boleh memiliki satu penilaian per tanggal. Jika petugas tidak hadir, pilih status Tidak Hadir dan skor tidak perlu diisi."
        >
          <div className="mb-4 flex items-center justify-between">
            <Badge variant={editingAssessment ? "warning" : "success"}>
              {editingAssessment ? "Mode edit" : "Mode input"}
            </Badge>
            {editingAssessment ? (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Batal edit
              </Button>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormSection
              title="Informasi penilaian"
              description="Pilih petugas, tanggal, dan status kehadiran sebelum mengisi skor penilaian."
            >
              <FormField
                label="Petugas"
                hint="Pilih petugas yang akan dinilai."
                error={formState.errors.officerId?.message}
              >
                <Select
                  {...register("officerId")}
                  onChange={(event) => {
                    setSelectedOfficerId(event.target.value);
                    setValue("officerId", event.target.value);
                  }}
                >
                  <option value="">Pilih petugas</option>
                  {officers.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name} ({officer.nip})
                    </option>
                  ))}
                </Select>
              </FormField>

              {activeOfficer ? (
                <div className="rounded-[var(--radius-control)] bg-white px-4 py-3 text-sm text-[var(--muted)] shadow-[var(--shadow-sm)]">
                  Unit: <span className="font-semibold text-[var(--foreground)]">
                    {activeOfficer.unit?.name ?? "Belum ditentukan"}
                  </span>
                </div>
              ) : null}

              <FormField
                label="Tanggal penilaian"
                error={formState.errors.assessmentDate?.message}
              >
                <DateInput {...register("assessmentDate")} />
              </FormField>

              <FormField label="Status kehadiran" error={formState.errors.status?.message}>
                <Select
                  {...register("status")}
                  onChange={(event) => {
                    const nextStatus = event.target.value as "PRESENT" | "ABSENT";
                    setStatusValue(nextStatus);
                    setValue("status", nextStatus);
                  }}
                >
                  <option value="PRESENT">Hadir</option>
                  <option value="ABSENT">Tidak Hadir</option>
                </Select>
              </FormField>
            </FormSection>

            {statusValue === "PRESENT" ? (
              <FormSection
                title="Skor per kriteria"
                description="Isi semua kriteria aktif dengan skala 1 sampai 10."
              >
                {criteria.map((item, index) => (
                  <div key={item.id} className="space-y-2">
                    <input
                      type="hidden"
                      value={item.id}
                      {...register(`scores.${index}.criteriaId` as const)}
                    />
                    <FormField
                      label={item.name}
                      hint={`Urutan tampil: ${item.sortOrder}`}
                      error={formState.errors.scores?.[index]?.score?.message}
                    >
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        {...register(`scores.${index}.score` as const, {
                          valueAsNumber: true
                        })}
                      />
                    </FormField>
                  </div>
                ))}
              </FormSection>
            ) : (
              <FormSection
                title="Status tidak hadir"
                description="Skor kriteria tidak akan disimpan, dan rata-rata nilai akan menjadi kosong."
              >
                <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
                  Status tidak hadir dipilih. Skor kriteria tidak akan disimpan,
                  dan rata-rata nilai akan menjadi kosong.
                </div>
              </FormSection>
            )}

            <FormSection
              title="Catatan tambahan"
              description="Tambahkan catatan operasional atau alasan tidak hadir bila diperlukan."
            >
              <FormField
                label="Catatan"
                hint="Opsional. Misalnya alasan tidak hadir atau catatan perilaku harian."
                error={formState.errors.notes?.message}
              >
                <Textarea placeholder="Tulis catatan jika diperlukan" {...register("notes")} />
              </FormField>
            </FormSection>

            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending
                ? "Menyimpan..."
                : editingAssessment
                  ? "Simpan perubahan"
                  : "Simpan penilaian"}
            </Button>
          </form>
        </Dialog>
      </section>
    </DashboardShell>
  );
}
