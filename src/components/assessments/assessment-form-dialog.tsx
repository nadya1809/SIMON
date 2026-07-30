"use client";

import { type ReactNode, useState } from "react";
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
import { SCORE_NUMERIC_ONLY_MESSAGE } from "@/lib/input-rules";
import { formatAverageScore } from "@/lib/scoring";
import { type UserAssessmentReference } from "@/lib/user-assessment-reference";
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
  userAssessmentReference: UserAssessmentReference | null;
  isUserAssessmentReferenceLoading: boolean;
  userAssessmentReferenceMessage?: string;
  statusValue: "PRESENT" | "ABSENT";
  liveAverageScore: number | null;
  isPending: boolean;
  canCheckDuplicate: boolean;
  isCheckingDuplicate: boolean;
  duplicateAssessmentMessage?: string;
  onClose: () => void;
  onOfficerQueryChange: (value: string) => void;
  onSelectOfficer: (officerId: string) => void;
  onClearOfficer: () => void;
  onAssessmentDateChange: () => void;
  onStatusValueChange: (value: "PRESENT" | "ABSENT") => void;
  onSubmit: (values: AssessmentFormValues) => void;
  getOfficerDisplayLabel: (officer: Pick<OfficerOption, "name" | "nip">) => string;
};

function isServiceUserRatingCriteria(criteriaName: string) {
  return criteriaName.trim().toLowerCase() === "penilaian pengguna layanan";
}

function isUserCommentCriteria(criteriaName: string) {
  return criteriaName.trim().toLowerCase() === "komplain";
}

function normalizeReferenceRating(value: number) {
  return Math.min(5, Math.max(1, Math.round(value)));
}

function ReferenceBadge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <span
      className={`rounded-[999px] px-2.5 py-1 text-xs font-semibold ${tone === "danger"
          ? "bg-[var(--danger-bg)] text-[var(--danger-fg)]"
          : "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
        }`}
    >
      {children}
    </span>
  );
}

function RatingBadge({
  label,
  value
}: {
  label: string;
  value: number;
}) {
  const rating = normalizeReferenceRating(value);

  return (
    <ReferenceBadge tone={rating <= 2 ? "danger" : "neutral"}>
      {label}: {rating}/5
    </ReferenceBadge>
  );
}

function ReferenceComments({ comments }: { comments: string[] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-[var(--foreground)]">
        Komentar
      </p>
      <div className="space-y-1">
        {comments.map((comment, index) => (
          <p
            key={`${index}-${comment}`}
            className="rounded-[0.75rem] bg-[var(--card)] px-3 py-2 text-xs leading-5 text-[var(--muted)]"
          >
            {comment}
          </p>
        ))}
      </div>
    </div>
  );
}

function ReferenceRatingRow({ item }: { item: UserAssessmentReference["assessments"][number] }) {
  return (
    <div className="space-y-2 rounded-[0.85rem] bg-[var(--card)] px-3 py-2">
      <div className="flex flex-wrap gap-2">
        <RatingBadge label="Rating layanan" value={item.serviceRating} />
        <RatingBadge label="Rating petugas" value={item.officerRating} />
      </div>
      <p className="text-xs leading-5 text-[var(--muted)]">
        {item.comment}
      </p>
    </div>
  );
}

function UserAssessmentReferenceHint({
  criteriaName,
  reference,
  isLoading,
  message
}: {
  criteriaName: string;
  reference: UserAssessmentReference | null;
  isLoading: boolean;
  message?: string;
}) {
  const shouldShowServiceReference = isServiceUserRatingCriteria(criteriaName);
  const shouldShowCommentReference = isUserCommentCriteria(criteriaName);

  if (!shouldShowServiceReference && !shouldShowCommentReference) {
    return null;
  }

  if (isLoading) {
    return (
      <p className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--muted)]">
        Memuat referensi penilaian pengguna...
      </p>
    );
  }

  if (!reference || !reference.assessments.length) {
    return (
      <p className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--muted)]">
        {message || "Belum ada referensi penilaian pengguna"}
      </p>
    );
  }

  if (shouldShowServiceReference) {
    return (
      <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Referensi pengguna
          </p>
          <ReferenceBadge>
            {reference.assessmentCount} rating
          </ReferenceBadge>
        </div>
        <div className="space-y-2">
          {reference.assessments.map((item, referenceIndex) => (
            <ReferenceRatingRow
              key={`${item.serviceRating}-${item.officerRating}-${referenceIndex}`}
              item={item}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Referensi komentar
        </p>
        <ReferenceBadge>
          {reference.commentCount} komentar
        </ReferenceBadge>
      </div>
      <ReferenceComments
        comments={reference.assessments.map((item) => item.comment)}
      />
    </div>
  );
}

export function AssessmentFormDialog({
  open,
  editingAssessment,
  form,
  criteria,
  displayedOfficerOptions,
  selectedOfficerId,
  officerPickerQuery,
  activeOfficer,
  userAssessmentReference,
  isUserAssessmentReferenceLoading,
  userAssessmentReferenceMessage,
  statusValue,
  liveAverageScore,
  isPending,
  canCheckDuplicate,
  isCheckingDuplicate,
  duplicateAssessmentMessage,
  onClose,
  onOfficerQueryChange,
  onSelectOfficer,
  onClearOfficer,
  onAssessmentDateChange,
  onStatusValueChange,
  onSubmit,
  getOfficerDisplayLabel
}: AssessmentFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState,
    setValue,
    unregister,
    watch,
    setError,
    trigger
  } = form;
  const [isOfficerDropdownOpen, setIsOfficerDropdownOpen] = useState(false);
  const officerIdValue = watch("officerId");

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
            hint="Buka dropdown, cari nama atau NIP, lalu pilih petugas yang sesuai."
            error={formState.errors.officerId?.message}
          >
            <div className="space-y-3">
              <input type="hidden" {...register("officerId")} />
              <button
                type="button"
                onClick={() => setIsOfficerDropdownOpen((current) => !current)}
                className="flex h-11 w-full items-center justify-between rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] px-4 text-left text-sm text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:border-[var(--accent)]"
              >
                <span className={officerIdValue ? "" : "text-[var(--muted)]"}>
                  {activeOfficer
                    ? getOfficerDisplayLabel(activeOfficer)
                    : "Pilih petugas"}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {isOfficerDropdownOpen ? "Tutup" : "Cari"}
                </span>
              </button>
              {isOfficerDropdownOpen ? (
                <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)]">
                  <Input
                    value={officerPickerQuery}
                    onChange={(event) => {
                      onOfficerQueryChange(event.target.value);
                    }}
                    placeholder="Cari nama atau NIP petugas"
                  />
                  <div className="max-h-56 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] p-2">
                    {displayedOfficerOptions.length ? (
                      <div className="space-y-1">
                        {displayedOfficerOptions.map((officer) => {
                          const isSelected = selectedOfficerId === officer.id;

                          return (
                            <button
                              key={officer.id}
                              type="button"
                              onClick={() => {
                                onSelectOfficer(officer.id);
                                setIsOfficerDropdownOpen(false);
                              }}
                              className={`flex w-full items-start justify-between gap-3 rounded-[0.85rem] px-3 py-2 text-left transition ${isSelected
                                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                                  : "hover:bg-[var(--card)]"
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
              ) : null}
              {activeOfficer ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsOfficerDropdownOpen(false);
                    onClearOfficer();
                  }}
                  className="inline-flex w-fit text-xs font-semibold text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                >
                  Hapus pilihan petugas
                </button>
              ) : null}
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
            error={
              (canCheckDuplicate ? duplicateAssessmentMessage : "") ||
              formState.errors.assessmentDate?.message
            }
          >
            <DateInput
              {...register("assessmentDate", {
                onChange: () => {
                  onAssessmentDateChange();
                }
              })}
            />
          </FormField>

          {canCheckDuplicate && isCheckingDuplicate ? (
            <p className="text-xs text-[var(--muted)]">
              Memeriksa apakah tanggal ini sudah dipakai untuk petugas yang dipilih...
            </p>
          ) : null}

          <FormField
            label="Status kehadiran"
            error={formState.errors.status?.message}
          >
            <Select
              {...register("status")}
              onChange={(event) => {
                const nextStatus = event.target.value as "PRESENT" | "ABSENT";
                onStatusValueChange(nextStatus);
                setValue("status", nextStatus, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true
                });

                if (nextStatus === "ABSENT") {
                  unregister("scores");
                  setValue("scores", []);
                }
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
                  <div className="space-y-2">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      inputMode="numeric"
                      onInput={(event) => {
                        const rawValue = event.currentTarget.value;
                        const numericValue = rawValue.replace(/\D+/g, "");

                        if (numericValue !== rawValue) {
                          event.currentTarget.value = numericValue;
                          setError(`scores.${index}.score` as const, {
                            type: "manual",
                            message: SCORE_NUMERIC_ONLY_MESSAGE
                          });
                          return;
                        }

                        if (numericValue && Number(numericValue) > 100) {
                          event.currentTarget.value = "100";
                        }

                        void trigger(`scores.${index}.score` as const);
                      }}
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
                    {activeOfficer ? (
                      <UserAssessmentReferenceHint
                        criteriaName={item.name}
                        reference={userAssessmentReference}
                        isLoading={isUserAssessmentReferenceLoading}
                        message={userAssessmentReferenceMessage}
                      />
                    ) : null}
                  </div>
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
              maxLength={255}
              {...register("notes")}
            />
          </FormField>
        </FormSection>

        <FormDialogActions
          isPending={isPending}
          disablePrimary={
            canCheckDuplicate &&
            (Boolean(duplicateAssessmentMessage) || isCheckingDuplicate)
          }
          isEditing={editingAssessment}
          createLabel="Simpan penilaian"
          primaryIcon={!editingAssessment ? faPlus : undefined}
          onCancel={onClose}
        />
      </form>
    </ModalDialog>
  );
}
