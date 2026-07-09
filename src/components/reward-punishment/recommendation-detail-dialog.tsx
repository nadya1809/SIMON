"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { SectionCard } from "@/components/ui/section-card";
import { Textarea } from "@/components/ui/textarea";
import { formatDateOnlyUtc } from "@/lib/date-only";
import {
  formatRecommendationPeriodLabel,
  getRewardPunishmentPeriodKindLabel
} from "@/lib/reward-punishment";
import { formatAverageScore } from "@/lib/scoring";
import {
  type RewardPunishmentActionInput,
  type RewardPunishmentActionValues
} from "@/lib/validations/reward-punishment";

type RecommendationDetailDialogProps = {
  open: boolean;
  recommendation: {
    id: string;
    type: "EVALUASI" | "REWARD" | "PUNISHMENT";
    status: "RECOMMENDED" | "APPROVED" | "REJECTED";
    referenceDate: string | Date;
    triggerScore: number;
    category: string;
    periodKind:
      | "DAILY"
      | "WORKWEEK"
      | "MONTHLY"
      | "QUARTERLY"
      | "SEMIANNUAL"
      | "YEARLY";
    periodStart: string | Date;
    periodEnd: string | Date;
    decidedAt: string | Date | null;
    officer: {
      name: string;
      nip: string;
      unit: { name: string } | null;
    };
    decidedBy: {
      name: string | null;
      role: string;
    } | null;
  } | null;
  form: UseFormReturn<
    RewardPunishmentActionInput,
    unknown,
    RewardPunishmentActionValues
  >;
  isDeciding: boolean;
  getTypeVariant: (type: "EVALUASI" | "REWARD" | "PUNISHMENT") => "default" | "success" | "danger";
  getTypeLabel: (type: "EVALUASI" | "REWARD" | "PUNISHMENT") => string;
  getStatusVariant: (status: "RECOMMENDED" | "APPROVED" | "REJECTED") => "warning" | "success" | "danger";
  getStatusLabel: (status: "RECOMMENDED" | "APPROVED" | "REJECTED") => string;
  toDateLabel: (value: string | Date) => string;
  onClose: () => void;
  onSubmit: (values: RewardPunishmentActionValues) => void;
};

export function RecommendationDetailDialog({
  open,
  recommendation,
  form,
  isDeciding,
  getTypeVariant,
  getTypeLabel,
  getStatusVariant,
  getStatusLabel,
  toDateLabel,
  onClose,
  onSubmit
}: RecommendationDetailDialogProps) {
  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="Detail dan keputusan data"
      description="Tinjau data yang sudah ada, lalu lakukan persetujuan atau penolakan bila statusnya masih menunggu keputusan."
      className="max-w-4xl"
    >
      {recommendation ? (
        <>
          <SectionCard className="mb-4 space-y-4 border-none bg-[var(--surface)] p-4 shadow-none">
            <div className="flex flex-wrap gap-2">
              <Badge variant={getTypeVariant(recommendation.type)}>
                {getTypeLabel(recommendation.type)}
              </Badge>
              <Badge variant={getStatusVariant(recommendation.status)}>
                {getStatusLabel(recommendation.status)}
              </Badge>
            </div>

            <div>
              <p className="text-lg font-bold">{recommendation.officer.name}</p>
              <p className="text-sm text-[var(--muted)]">
                NIP {recommendation.officer.nip} ·{" "}
                {recommendation.officer.unit?.name ?? "Tanpa unit"}
              </p>
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3">
                <p className="text-[var(--muted)]">Periode</p>
                <p className="mt-1 font-semibold">
                  {formatRecommendationPeriodLabel({
                    periodKind: recommendation.periodKind,
                    periodStart: recommendation.periodStart,
                    periodEnd: recommendation.periodEnd
                  })}
                </p>
              </div>
              <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3">
                <p className="text-[var(--muted)]">Tanggal acuan</p>
                <p className="mt-1 font-semibold">
                  {formatDateOnlyUtc(recommendation.referenceDate)}
                </p>
              </div>
              <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3">
                <p className="text-[var(--muted)]">Skor pemicu</p>
                <p className="mt-1 font-semibold">
                  {formatAverageScore(recommendation.triggerScore)}
                </p>
              </div>
              <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3">
                <p className="text-[var(--muted)]">Kategori</p>
                <p className="mt-1 font-semibold">{recommendation.category}</p>
              </div>
              <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3">
                <p className="text-[var(--muted)]">Jenis periode</p>
                <p className="mt-1 font-semibold">
                  {getRewardPunishmentPeriodKindLabel(recommendation.periodKind)}
                </p>
              </div>
            </div>

            {recommendation.decidedBy ? (
              <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3 text-sm">
                <p className="text-[var(--muted)]">Keputusan terakhir</p>
                <p className="mt-1 font-semibold">
                  {recommendation.decidedBy.name ?? "Pengguna"} ·{" "}
                  {recommendation.decidedBy.role}
                </p>
                <p className="mt-1 text-[var(--muted)]">
                  {recommendation.decidedAt
                    ? toDateLabel(recommendation.decidedAt)
                    : "-"}
                </p>
              </div>
            ) : null}
          </SectionCard>

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormSection
              title="Keputusan akhir"
              description="Perbarui kategori atau catatan sebelum data disetujui atau ditolak."
            >
              <FormField
                label="Kategori final"
                error={form.formState.errors.category?.message}
              >
                <Input
                  placeholder="Perbarui kategori jika diperlukan"
                  {...form.register("category")}
                />
              </FormField>

              <FormField
                label="Catatan keputusan"
                hint="Opsional, tetapi disarankan untuk persetujuan atau penolakan."
                error={form.formState.errors.notes?.message}
              >
                <Textarea
                  placeholder="Tulis alasan atau detail keputusan"
                  {...form.register("notes")}
                />
              </FormField>
            </FormSection>

            {recommendation.status === "RECOMMENDED" ? (
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <Button
                  type="submit"
                  disabled={isDeciding}
                  onClick={() => form.setValue("action", "APPROVE")}
                >
                  {isDeciding ? "Menyimpan..." : "Setujui data"}
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={isDeciding}
                  onClick={() => form.setValue("action", "REJECT")}
                >
                  {isDeciding ? "Menyimpan..." : "Tolak data"}
                </Button>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Tutup
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
                  Data ini sudah diputuskan. Buat data baru pada periode lain
                  jika diperlukan tindak lanjut tambahan.
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Tutup
                  </Button>
                </div>
              </div>
            )}
          </form>
        </>
      ) : (
        <EmptyState
          title="Belum ada data yang dipilih"
          description="Pilih salah satu baris di tabel untuk melihat detail dan melakukan persetujuan atau penolakan."
          icon="RP"
        />
      )}
    </ModalDialog>
  );
}
