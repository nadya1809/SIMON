import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { formControlClassName } from "@/components/ui/primitive-styles";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        formControlClassName,
        "min-h-28 px-4 py-3",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
