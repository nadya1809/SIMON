"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogIconClose,
  DialogTitle
} from "@/components/ui/dialog";

type ModalDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  bodyClassName?: string;
};

export function ModalDialog({
  open,
  title,
  description,
  children,
  onClose,
  className,
  bodyClassName
}: ModalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen: boolean) => !nextOpen && onClose()}>
      <DialogContent className={cn("max-w-3xl", className)}>
        <DialogHeader className="sticky top-0 z-10 flex-row items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 space-y-1">
            <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </div>
          <DialogIconClose />
        </DialogHeader>
        <DialogBody className={bodyClassName}>{children}</DialogBody>
      </DialogContent>
    </Dialog>
  );
}
