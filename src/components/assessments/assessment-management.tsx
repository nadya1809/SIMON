"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import {
  faPenToSquare,
  faPlus,
  faRotateLeft,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormField } from "@/components/forms/form-field";
import { ActionMenu } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { DateInput } from "@/components/ui/date-input";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDateOnlyUtc,
  getTodayDateInputValue
} from "@/lib/date-only";
import {
  getDefaultTimePreset,
  getTimePresetRange,
  TIME_PRESET_OPTIONS,
  type TimePreset
} from "@/lib/time-presets";
import { calculateAverageScore, formatAverageScore } from "@/lib/scoring";
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
  score: number | "";
};

function createDefaultScores(criteria: CriteriaOption[]) {
  return criteria.map((item) => ({
    criteriaId: item.id,
    score: ""
  }));
}

function getOfficerDisplayLabel(officer: Pick<OfficerOption, "name" | "nip">) {
  return `${officer.name} (${officer.nip})`;
}

export function AssessmentManagement({
  initialAssessments,
  officers,
  criteria,
  role
}: AssessmentManagementProps) {
  const [assessments, setAssessments] = useState(initialAssessments);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentItem | null>(null);
  const [pendingSubmitValues, setPendingSubmitValues] =
    useState<AssessmentFormValues | null>(null);
  const [confirmingAssessment, setConfirmingAssessment] =
    useState<AssessmentItem | null>(null);
  const [statusValue, setStatusValue] = useState<"PRESENT" | "ABSENT">(
    "PRESENT"
  );
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(
    null
  );
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [officerPickerQuery, setOfficerPickerQuery] = useState("");
  const [searchOfficer, setSearchOfficer] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [timePreset, setTimePreset] = useState<TimePreset>(getDefaultTimePreset());
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(searchOfficer);
  const { from: fromDate, to: toDate } = getTimePresetRange(timePreset);

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
      assessmentDate: getTodayDateInputValue(),
      status: "PRESENT",
      notes: "",
      scores: createDefaultScores(criteria)
    }
  });

  const { register, handleSubmit, reset, formState, setValue, control } = form;
  const watchedScores = useWatch({
    control,
    name: "scores"
  });
  const validLiveScores = (watchedScores ?? [])
    .map((item) => Number(item?.score))
    .filter((score) => Number.isFinite(score) && score >= 1 && score <= 100);
  const liveAverageScore =
    statusValue === "PRESENT" && validLiveScores.length === criteria.length
      ? calculateAverageScore(validLiveScores)
      : null;

  function resetForm() {
    setIsFormDialogOpen(false);
    setEditingAssessment(null);
    setStatusValue("PRESENT");
    setSelectedOfficerId("");
    setOfficerPickerQuery("");
    reset({
      officerId: "",
      assessmentDate: getTodayDateInputValue(),
      status: "PRESENT",
      notes: "",
      scores: createDefaultScores(criteria)
    });
  }

  function startEditMode(assessment: AssessmentItem) {
    setIsFormDialogOpen(true);
    setEditingAssessment(assessment);
    setStatusValue(assessment.status);
    setSelectedOfficerId(assessment.officerId);
    setOfficerPickerQuery(getOfficerDisplayLabel(assessment.officer));
    reset({
      officerId: assessment.officerId,
      assessmentDate: formatDateOnlyUtc(assessment.assessmentDate),
      status: assessment.status,
      notes: assessment.notes ?? "",
      scores: criteria.map((item) => ({
        criteriaId: item.id,
        score:
          assessment.scores.find((score) => score.criteria.id === item.id)
            ?.score ?? ""
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

      const dateValue = formatDateOnlyUtc(item.assessmentDate);

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

  const totalPages = Math.max(1, Math.ceil(filteredAssessments.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const displayedAssessments = filteredAssessments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const normalizedOfficerPickerQuery = officerPickerQuery.trim().toLowerCase();
  const displayedOfficerOptions = officers
    .filter((officer) => {
      if (!normalizedOfficerPickerQuery) {
        return true;
      }

      return `${officer.name} ${officer.nip}`
        .toLowerCase()
        .includes(normalizedOfficerPickerQuery);
    })
    .slice(0, normalizedOfficerPickerQuery ? 8 : 6);

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

  function selectOfficer(officer: OfficerOption) {
    setSelectedOfficerId(officer.id);
    setOfficerPickerQuery(getOfficerDisplayLabel(officer));
    setValue("officerId", officer.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  }

  return (
    <DashboardShell
      title="Penilaian Harian"
      description="Input dan pantau penilaian harian petugas PST. Status tidak hadir tetap harus dicatat agar kepatuhan pengisian harian tetap akurat."
      role={role}
    >
      <section className="space-y-5">
        <FilterToolbar>
          <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Cari petugas">
              <Input
                value={searchOfficer}
                onChange={(event) => {
                  setSearchOfficer(event.target.value);
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

            <FormField label="Status hadir">
              <Select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setPage(1);
                }}
              >
                <option value="all">Semua status</option>
                <option value="PRESENT">Hadir</option>
                <option value="ABSENT">Tidak Hadir</option>
              </Select>
            </FormField>

            <FormField label="Filter waktu">
              <Select
                value={timePreset}
                onChange={(event) => {
                  setTimePreset(event.target.value as TimePreset);
                  setPage(1);
                }}
              >
                {TIME_PRESET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="flex items-end gap-3">
            <Button
              icon={faPlus}
              onClick={() => {
                resetForm();
                setIsFormDialogOpen(true);
              }}
            >
              Input Penilaian
            </Button>
            <Button
              variant="secondary"
              icon={faRotateLeft}
              onClick={() => {
                setSearchOfficer("");
                setUnitFilter("all");
                setStatusFilter("all");
                setTimePreset(getDefaultTimePreset());
                setPage(1);
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
                    {formatDateOnlyUtc(item.assessmentDate)}
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
                          onClick: () => setConfirmingAssessment(item)
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
                    title={
                      assessments.length
                        ? "Tidak ada penilaian untuk filter ini"
                        : "Belum ada penilaian harian"
                    }
                    description={
                      assessments.length
                        ? "Ubah filter tanggal, unit, atau nama petugas untuk melihat data yang lain."
                        : "Tambahkan penilaian pertama agar monitoring harian petugas PST mulai berjalan."
                    }
                    icon="A"
                    actionLabel="Input Penilaian"
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

        {filteredAssessments.length ? (
          <PaginationBar
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredAssessments.length}
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
        open={isFormDialogOpen}
        onClose={resetForm}
        title={editingAssessment ? "Edit penilaian" : "Input penilaian baru"}
        description="Satu petugas hanya boleh memiliki satu penilaian per tanggal. Jika petugas tidak hadir, pilih status Tidak Hadir dan skor tidak perlu diisi."
        className="max-w-4xl"
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

          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => {
              setPendingSubmitValues(values);
            })}
          >
            <FormSection
              title="Informasi penilaian"
              description="Pilih petugas, tanggal, dan status kehadiran sebelum mengisi skor penilaian."
            >
              <FormField
                label="Petugas"
                hint="Cari nama atau NIP, lalu pilih salah satu hasil di bawah."
                error={formState.errors.officerId?.message}
              >
                <div className="space-y-3">
                  <input type="hidden" {...register("officerId")} />
                  <Input
                    value={officerPickerQuery}
                    onChange={(event) => {
                      const nextQuery = event.target.value;
                      setOfficerPickerQuery(nextQuery);

                      if (
                        activeOfficer &&
                        nextQuery !== getOfficerDisplayLabel(activeOfficer)
                      ) {
                        setSelectedOfficerId("");
                        setValue("officerId", "", {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true
                        });
                      }
                    }}
                    placeholder="Cari nama atau NIP petugas"
                  />
                  <div className="max-h-56 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] p-2 shadow-[var(--shadow-sm)]">
                    {displayedOfficerOptions.length ? (
                      <div className="space-y-1">
                        {displayedOfficerOptions.map((officer) => {
                          const isSelected = selectedOfficerId === officer.id;

                          return (
                            <button
                              key={officer.id}
                              type="button"
                              onClick={() => selectOfficer(officer)}
                              className={`flex w-full items-start justify-between gap-3 rounded-[0.85rem] px-3 py-2 text-left transition ${
                                isSelected
                                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                                  : "hover:bg-[var(--surface)]"
                              }`}
                            >
                              <div>
                                <p className="font-medium">{officer.name}</p>
                                <p className="text-xs text-[var(--muted)]">
                                  NIP: {officer.nip}
                                </p>
                              </div>
                              <div className="text-right text-xs text-[var(--muted)]">
                                {officer.unit?.name ?? "Tanpa unit"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-3 py-6 text-center text-sm text-[var(--muted)]">
                        Tidak ada petugas yang cocok dengan pencarian ini.
                      </div>
                    )}
                  </div>
                </div>
              </FormField>

              {activeOfficer ? (
                <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted)] shadow-[var(--shadow-sm)]">
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
                description="Masukkan nilai manual untuk tiap kriteria. Rentang nilai yang diperbolehkan adalah angka bulat 1 sampai 100."
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
                      hint={`Urutan tampil: ${item.sortOrder} · Input angka bulat 1-100`}
                      error={formState.errors.scores?.[index]?.score?.message}
                    >
                      <>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          step="1"
                          inputMode="numeric"
                          onKeyDown={(event) => {
                            if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
                              event.preventDefault();
                            }
                          }}
                          {...register(`scores.${index}.score` as const, {
                            setValueAs: (value) =>
                              value === "" || value === null || value === undefined
                                ? ""
                                : Number.parseInt(String(value), 10)
                          })}
                        />
                      </>
                    </FormField>
                  </div>
                ))}
                <FormField
                  label="Rata-rata otomatis"
                  hint="Nilai ini dihitung otomatis setelah semua skor kriteria diisi valid oleh admin."
                >
                  <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card)_0%,var(--surface)_100%)] px-4 py-3 shadow-[var(--shadow-sm)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Rata-rata sementara
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[var(--accent-strong)]">
                      {formatAverageScore(liveAverageScore)}
                    </p>
                  </div>
                </FormField>
              </FormSection>
            ) : (
              <FormSection
                title="Status tidak hadir"
                description="Skor kriteria tidak akan disimpan, dan rata-rata nilai akan menjadi kosong."
              >
                <div className="space-y-4">
                  <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted)]">
                    Status tidak hadir dipilih. Skor kriteria tidak akan disimpan,
                    dan rata-rata nilai akan menjadi kosong.
                  </div>
                  <FormField
                    label="Rata-rata otomatis"
                    hint="Field ini tetap tampil, tetapi tidak dihitung saat status tidak hadir dipilih."
                  >
                    <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card)_0%,var(--surface)_100%)] px-4 py-3 shadow-[var(--shadow-sm)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Rata-rata sementara
                      </p>
                      <p className="mt-2 text-2xl font-bold text-[var(--muted)]">
                        {formatAverageScore(null)}
                      </p>
                    </div>
                  </FormField>
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

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Menyimpan..."
                  : editingAssessment
                    ? "Simpan perubahan"
                    : "Simpan penilaian"}
              </Button>
            </div>
          </form>
      </ModalDialog>

      <ConfirmDialog
        open={Boolean(pendingSubmitValues)}
        title={
          editingAssessment
            ? "Simpan perubahan penilaian?"
            : "Simpan penilaian harian?"
        }
        description={
          editingAssessment
            ? "Perubahan penilaian akan langsung memperbarui rekap dan laporan."
            : "Penilaian baru akan langsung masuk ke dashboard dan laporan."
        }
        variant="primary"
        icon={editingAssessment ? faPenToSquare : faPlus}
        confirmLabel="Ya, simpan"
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
        open={Boolean(confirmingAssessment)}
        title={
          confirmingAssessment
            ? `Hapus penilaian ${confirmingAssessment.officer.name}?`
            : "Hapus penilaian?"
        }
        description="Data penilaian harian yang dihapus tidak bisa dipulihkan lagi."
        isLoading={
          Boolean(confirmingAssessment) &&
          deletingAssessmentId === confirmingAssessment?.id
        }
        onClose={() => {
          if (!deletingAssessmentId) {
            setConfirmingAssessment(null);
          }
        }}
        onConfirm={() => {
          if (confirmingAssessment) {
            void deleteAssessment(confirmingAssessment).finally(() =>
              setConfirmingAssessment(null)
            );
          }
        }}
      />
    </DashboardShell>
  );
}
