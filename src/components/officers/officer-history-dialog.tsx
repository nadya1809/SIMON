"use client";

import { FormField } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Table } from "@/components/ui/table";
import { formatAverageScore } from "@/lib/scoring";

type OfficerHistoryDialogProps = {
  open: boolean;
  officer: {
    name: string;
    nip: string;
    unit: { name: string } | null;
  } | null;
  historyItems: Array<{
    id: string;
    assessmentDate: string;
    status: "PRESENT" | "ABSENT";
    averageScore: number | null;
    notes: string | null;
    assessor: {
      name: string | null;
      role: string;
    };
    scores: Array<{
      score: number;
      criteria: { name: string };
    }>;
  }>;
  historyFrom: string;
  historyTo: string;
  isLoading: boolean;
  formatDateLabel: (value: string) => string;
  onClose: () => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

export function OfficerHistoryDialog({
  open,
  officer,
  historyItems,
  historyFrom,
  historyTo,
  isLoading,
  formatDateLabel,
  onClose,
  onFromChange,
  onToChange,
  onApply,
  onReset
}: OfficerHistoryDialogProps) {
  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={officer ? `Riwayat penilaian ${officer.name}` : "Riwayat penilaian petugas"}
      description="Lihat detail penilaian harian per petugas, termasuk skor tiap kriteria dan rata-rata per hari."
      className="max-w-6xl"
    >
      {officer ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-sm)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                Petugas
              </p>
              <p className="mt-1 font-semibold">{officer.name}</p>
              <p className="text-sm text-[var(--muted)]">NIP: {officer.nip}</p>
            </div>
            <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-sm)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                Unit
              </p>
              <p className="mt-1 font-semibold">
                {officer.unit?.name ?? "Belum ditentukan"}
              </p>
            </div>
            <div className="rounded-[var(--radius-control)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-sm)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                Total data
              </p>
              <p className="mt-1 font-semibold">{historyItems.length} hari penilaian</p>
            </div>
          </div>

          <form
            className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              onApply();
            }}
          >
            <FormField label="Dari tanggal">
              <Input
                type="date"
                value={historyFrom}
                onChange={(event) => onFromChange(event.target.value)}
              />
            </FormField>
            <FormField label="Sampai tanggal">
              <Input
                type="date"
                value={historyTo}
                onChange={(event) => onToChange(event.target.value)}
              />
            </FormField>
            <div className="flex items-end gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Memuat..." : "Terapkan"}
              </Button>
              <Button type="button" variant="secondary" onClick={onReset} disabled={isLoading}>
                Reset
              </Button>
            </div>
          </form>

          <div className="rounded-[var(--radius-card)] border border-[var(--border)]">
            <Table
              headers={[
                "Tanggal",
                "Status",
                "Skor per kriteria",
                "Rata-rata",
                "Penilai",
                "Catatan"
              ]}
            >
              {historyItems.length ? (
                historyItems.map((item) => (
                  <tr key={item.id} className="border-t border-[var(--border)]">
                    <td className="px-5 py-4 font-medium">
                      {formatDateLabel(item.assessmentDate)}
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
                    <td className="px-5 py-4 text-[var(--muted)]">
                      {item.assessor.name ?? "Pengguna"} ({item.assessor.role})
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)]">
                      {item.notes || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8">
                    <EmptyState
                      title={
                        isLoading
                          ? "Sedang memuat riwayat"
                          : "Belum ada riwayat penilaian"
                      }
                      description={
                        isLoading
                          ? "Mohon tunggu sebentar sementara data penilaian harian diambil."
                          : "Coba ubah rentang tanggal atau tambahkan penilaian harian untuk petugas ini."
                      }
                      icon="R"
                    />
                  </td>
                </tr>
              )}
            </Table>
          </div>
        </div>
      ) : null}
    </ModalDialog>
  );
}
