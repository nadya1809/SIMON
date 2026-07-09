import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FormDialogHeaderProps = {
  isEditing: boolean;
  createLabel?: string;
  editLabel?: string;
  cancelLabel?: string;
  onCancelEdit?: () => void;
  actions?: ReactNode;
};

export function FormDialogHeader({
  isEditing,
  createLabel = "Mode tambah",
  editLabel = "Mode edit",
  cancelLabel = "Batal edit",
  onCancelEdit,
  actions
}: FormDialogHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <Badge variant={isEditing ? "warning" : "success"}>
        {isEditing ? editLabel : createLabel}
      </Badge>
      <div className="flex items-center gap-2">
        {actions}
        {isEditing && onCancelEdit ? (
          <Button variant="ghost" size="sm" onClick={onCancelEdit}>
            {cancelLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
