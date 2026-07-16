import { ReactNode } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Button } from "@/components/ui/button";

type FormDialogActionsProps = {
  isPending?: boolean;
  isEditing?: boolean;
  disablePrimary?: boolean;
  cancelLabel?: string;
  pendingLabel?: string;
  createLabel?: string;
  updateLabel?: string;
  primaryIcon?: IconDefinition;
  onCancel: () => void;
  children?: ReactNode;
};

export function FormDialogActions({
  isPending = false,
  isEditing = false,
  disablePrimary = false,
  cancelLabel = "Batal",
  pendingLabel = "Menyimpan...",
  createLabel = "Simpan",
  updateLabel = "Simpan perubahan",
  primaryIcon,
  onCancel,
  children
}: FormDialogActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      {children}
      <Button type="button" variant="secondary" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        disabled={isPending || disablePrimary}
        icon={primaryIcon}
      >
        {isPending ? pendingLabel : isEditing ? updateLabel : createLabel}
      </Button>
    </div>
  );
}
