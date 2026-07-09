import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { formControlClassName } from "@/components/ui/primitive-styles";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      data-slot="input"
      className={cn(
        formControlClassName,
        "h-11 px-4",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
