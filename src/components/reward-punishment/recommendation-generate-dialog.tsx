"use client";

import { faWandSparkles } from "@fortawesome/free-solid-svg-icons";
import { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  rewardPunishmentGenerationModeOptions,
  rewardPunishmentPeriodOptions
} from "@/lib/reward-punishment";
import {
  type RewardPunishmentGenerationInput,
  type RewardPunishmentGenerationValues
} from "@/lib/validations/reward-punishment";

type RecommendationGenerateDialogProps = {
  open: boolean;
  form: UseFormReturn<
    RewardPunishmentGenerationInput,
    unknown,
    RewardPunishmentGenerationValues
  >;
  generationMode: "EVALUASI" | "REWARD" | "PUNISHMENT" | "REWARD_PUNISHMENT";
  isGenerating: boolean;
  onClose: () => void;
  onSubmit: (values: RewardPunishmentGenerationValues) => void;
};

export function RecommendationGenerateDialog({
  open,
  form,
  generationMode,
  isGenerating,
  onClose,
  onSubmit
}: RecommendationGenerateDialogProps) {
  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="Generate evaluasi atau tindak lanjut"
      description="Sistem akan menghitung rata-rata skor dari assessment PRESENT pada periode terpilih. Evaluasi bersifat netral, sedangkan reward dan punishment tetap mengikuti threshold yang berlaku."
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormSection
          title="Parameter generate"
          description="Tentukan jenis periode, tanggal acuan, jenis generate, dan label kategori yang akan dipakai pada data baru."
        >
          <FormField
            label="Jenis periode"
            error={form.formState.errors.periodKind?.message}
          >
            <Select {...form.register("periodKind")}>
              {rewardPunishmentPeriodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Tanggal acuan"
            hint="Untuk minggu kerja, sistem akan otomatis menarik ke Jumat terakhir."
            error={form.formState.errors.referenceDate?.message}
          >
            <DateInput {...form.register("referenceDate")} />
          </FormField>

          <FormField
            label="Jenis generate"
            error={form.formState.errors.generationMode?.message}
          >
            <Select {...form.register("generationMode")}>
              {rewardPunishmentGenerationModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          {(generationMode === "EVALUASI" ||
            generationMode === "REWARD_PUNISHMENT") && (
            <FormField
              label="Kategori evaluasi"
              error={form.formState.errors.evaluationCategory?.message}
            >
            <Input
              placeholder="Contoh: Evaluasi Mingguan"
              maxLength={100}
              autoCapitalize="sentences"
              {...form.register("evaluationCategory")}
            />
            </FormField>
          )}

          {(generationMode === "REWARD" ||
            generationMode === "REWARD_PUNISHMENT") && (
            <FormField
              label="Kategori reward"
              error={form.formState.errors.rewardCategory?.message}
            >
            <Input
              placeholder="Contoh: Reward Bulanan"
              maxLength={100}
              autoCapitalize="sentences"
              {...form.register("rewardCategory")}
            />
            </FormField>
          )}

          {(generationMode === "PUNISHMENT" ||
            generationMode === "REWARD_PUNISHMENT") && (
            <FormField
              label="Kategori punishment"
              error={form.formState.errors.punishmentCategory?.message}
            >
            <Input
              placeholder="Contoh: Teguran Bulanan"
              maxLength={100}
              autoCapitalize="sentences"
              {...form.register("punishmentCategory")}
            />
            </FormField>
          )}

          <FormField
            label="Catatan awal"
            hint="Opsional. Catatan ini akan disalin ke data baru yang dibuat."
            error={form.formState.errors.notes?.message}
          >
            <Textarea
              placeholder="Tulis catatan awal jika diperlukan"
              maxLength={255}
              {...form.register("notes")}
            />
          </FormField>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isGenerating} icon={faWandSparkles}>
            {isGenerating ? "Memproses..." : "Generate Data"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
