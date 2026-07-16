"use client";

import { UseFormReturn } from "react-hook-form";
import { BooleanStatusField } from "@/components/forms/boolean-status-field";
import { FormField } from "@/components/forms/form-field";
import { FormDialogActions } from "@/components/ui/form-dialog-actions";
import { FormDialogHeader } from "@/components/ui/form-dialog-header";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Select } from "@/components/ui/select";
import {
  LETTERS_ONLY_MESSAGE,
  NUMERIC_ONLY_MESSAGE
} from "@/lib/input-rules";
import {
  officerJabatanOptions,
  type OfficerFormValues
} from "@/lib/validations/officer";

type OfficerFormDialogProps = {
  open: boolean;
  editingOfficer: boolean;
  form: UseFormReturn<OfficerFormValues>;
  units: Array<{ id: string; name: string }>;
  isActiveValue: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: OfficerFormValues) => void;
  onToggleActive: () => void;
};

export function OfficerFormDialog({
  open,
  editingOfficer,
  form,
  units,
  isActiveValue,
  isPending,
  onClose,
  onSubmit,
  onToggleActive
}: OfficerFormDialogProps) {
  const { register, handleSubmit, formState, setError, trigger } = form;

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={editingOfficer ? "Edit petugas" : "Tambah petugas baru"}
      description="Gunakan NIP unik untuk setiap petugas. Status nonaktif akan mempertahankan histori data lama."
      className="max-w-4xl"
    >
      <FormDialogHeader isEditing={editingOfficer} onCancelEdit={onClose} />

      <form
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormSection
          title="Identitas petugas"
          description="Lengkapi identitas dasar petugas dan hubungkan ke unit jika sudah tersedia."
        >
          <FormField
            label="NIP"
            hint="Harus unik untuk setiap petugas dan hanya boleh berisi angka."
            error={formState.errors.nip?.message}
          >
            <Input
              placeholder="Masukkan NIP petugas"
              inputMode="numeric"
              pattern="[0-9]*"
              minLength={5}
              maxLength={30}
              onInput={(event) => {
                const sanitizedValue = event.currentTarget.value.replace(/\D+/g, "");

                if (sanitizedValue !== event.currentTarget.value) {
                  event.currentTarget.value = sanitizedValue;
                  setError("nip", {
                    type: "manual",
                    message: NUMERIC_ONLY_MESSAGE
                  });
                  return;
                }

                void trigger("nip");
              }}
              {...register("nip")}
            />
          </FormField>

          <FormField
            label="Nama petugas"
            error={formState.errors.name?.message}
          >
            <Input
              placeholder="Masukkan nama lengkap petugas"
              autoCapitalize="words"
              maxLength={120}
              onInput={(event) => {
                const sanitizedValue = event.currentTarget.value.replace(
                  /[^\p{L}\s.'-]+/gu,
                  ""
                );

                if (sanitizedValue !== event.currentTarget.value) {
                  event.currentTarget.value = sanitizedValue;
                  setError("name", {
                    type: "manual",
                    message: LETTERS_ONLY_MESSAGE
                  });
                  return;
                }

                void trigger("name");
              }}
              {...register("name")}
            />
          </FormField>

          <FormField
            label="Jabatan"
            hint="Pilih jabatan petugas dari daftar yang tersedia."
            error={formState.errors.jabatan?.message}
          >
            <Select {...register("jabatan")}>
              <option value="">Belum ditentukan</option>
              {officerJabatanOptions.map((jabatan) => (
                <option key={jabatan} value={jabatan}>
                  {jabatan}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Unit"
            hint="Boleh dikosongkan jika belum ditentukan."
          >
            <Select {...register("unitId")}>
              <option value="">Belum ditentukan</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </FormField>
        </FormSection>

        <FormSection
          title="Status petugas"
          description="Status nonaktif akan mempertahankan histori lama tetapi menyembunyikan petugas dari alur aktif."
        >
          <BooleanStatusField
            label="Status petugas"
            value={isActiveValue}
            onToggle={onToggleActive}
            enabledText="Petugas aktif dan bisa dipakai untuk penilaian"
            disabledText="Petugas nonaktif, histori tetap dipertahankan"
          >
            <input type="hidden" value={isActiveValue ? "true" : "false"} />
          </BooleanStatusField>
        </FormSection>

        <FormDialogActions
          isPending={isPending}
          isEditing={editingOfficer}
          createLabel="Tambah petugas"
          onCancel={onClose}
        />
      </form>
    </ModalDialog>
  );
}
