import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
