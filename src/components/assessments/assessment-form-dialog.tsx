"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { DateInput } from "@/components/ui/date-input";
import { FormDialogActions } from "@/components/ui/form-dialog-actions";
import { FormDialogHeader } from "@/components/ui/form-dialog-header";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatAverageScore } from "@/lib/scoring";
import {
  type AssessmentFormInput,
  type AssessmentFormValues
} from "@/lib/validations/assessment";

type OfficerOption = {
  id: string;
  name: string;
  nip: string;
  unit: { id: string; name: string } | null;
};

type CriteriaOption = {
  id: string;
  name: string;
  sortOrder: number;
};

type AssessmentFormDialogProps = {
  open: boolean;
  editingAssessment: boolean;
  form: UseFormReturn<AssessmentFormInput, unknown, AssessmentFormValues>;
  criteria: CriteriaOption[];
  displayedOfficerOptions: OfficerOption[];
  selectedOfficerId: string;
  officerPickerQuery: string;
  activeOfficer?: OfficerOption;
  statusValue: "PRESENT" | "ABSENT";
  liveAverageScore: number | null;
  isPending: boolean;
  onClose: () => void;
  onOfficerQueryChange: (value: string) => void;
  onSelectOfficer: (officerId: string) => void;
  onStatusValueChange: (value: "PRESENT" | "ABSENT") => void;
  onSubmit: (values: AssessmentFormValues) => void;
  getOfficerDisplayLabel: (officer: Pick<OfficerOption, "name" | "nip">) => string;
};

export function AssessmentFormDialog({
  open,
  editingAssessment,
  form,
  criteria,
  displayedOfficerOptions,
  selectedOfficerId,
  officerPickerQuery,
  activeOfficer,
  statusValue,
  liveAverageScore,
  isPending,
  onClose,
  onOfficerQueryChange,
  onSelectOfficer,
  onStatusValueChange,
  onSubmit,
  getOfficerDisplayLabel
}: AssessmentFormDialogProps) {
  const { register, handleSubmit, formState, setValue } = form;

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={editingAssessment ? "Edit penilaian" : "Input penilaian baru"}
      description="Satu petugas hanya boleh memiliki satu penilaian per tanggal. Jika petugas tidak hadir, pilih status Tidak Hadir dan skor tidak perlu diisi."
      className="max-w-4xl"
    >
      <FormDialogHeader
        isEditing={editingAssessment}
        createLabel="Mode input"
        onCancelEdit={onClose}
      />

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
                  onOfficerQueryChange(nextQuery);

                  if (
                    activeOfficer &&
                    nextQuery !== getOfficerDisplayLabel(activeOfficer)
                  ) {
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
                          onClick={() => onSelectOfficer(officer.id)}
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

          <FormField
            label="Status kehadiran"
            error={formState.errors.status?.message}
          >
            <Select
              {...register("status")}
              onChange={(event) => {
                const nextStatus = event.target.value as "PRESENT" | "ABSENT";
                onStatusValueChange(nextStatus);
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
            <Textarea
              placeholder="Tulis catatan jika diperlukan"
              {...register("notes")}
            />
          </FormField>
        </FormSection>

        <FormDialogActions
          isPending={isPending}
          isEditing={editingAssessment}
          createLabel="Simpan penilaian"
          primaryIcon={!editingAssessment ? faPlus : undefined}
          onCancel={onClose}
        />
      </form>
    </ModalDialog>
  );
}
